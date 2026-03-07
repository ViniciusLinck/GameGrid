import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearRemoteVote, getResults, pollApiConfig, postVote } from "../services/pollApi";
import { getClientId, savePollVote, clearPollVote } from "../services/pollStorage";
import { formatPollResult } from "../utils/pollUtils";

function getRefetchInterval(startsAtUtc, isLive = false) {
  if (isLive) {
    return 5000;
  }

  if (!startsAtUtc) {
    return 30000;
  }

  const now = Date.now();
  const start = new Date(startsAtUtc).getTime();
  if (Number.isNaN(start)) {
    return 30000;
  }

  const nearWindow = 90 * 60 * 1000;
  if (Math.abs(start - now) <= nearWindow) {
    return 5000;
  }

  return 30000;
}

export function usePollRemote(matchId, { startsAtUtc, isLive = false, enabled = true } = {}) {
  const queryClient = useQueryClient();
  const queryKey = ["poll-remote", String(matchId)];
  const localKey = ["poll-local", String(matchId)];
  const clientId = getClientId();

  const query = useQuery({
    queryKey,
    queryFn: () => getResults(matchId),
    enabled: enabled && Boolean(matchId) && pollApiConfig.enabled,
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.hidden) {
        return false;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return false;
      }
      return getRefetchInterval(startsAtUtc, isLive);
    },
    refetchIntervalInBackground: false,
    retry: (count, error) => {
      if (error?.status === 429) {
        return count < 5;
      }
      return count < 2;
    },
    retryDelay: (attempt, error) => {
      if (error?.status === 429) {
        return Math.min(1000 * 2 ** attempt, 15000);
      }
      return 1000;
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (choice) => {
      const response = await postVote(matchId, choice, clientId);
      await savePollVote(matchId, choice);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: localKey });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await clearRemoteVote(matchId, clientId);
      await clearPollVote(matchId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: localKey });
    },
  });

  const counts = query.data?.counts ?? {
    home: query.data?.home ?? 0,
    draw: query.data?.draw ?? 0,
    away: query.data?.away ?? 0,
  };

  return {
    mode: "remote",
    clientId,
    vote: query.data?.myVote ?? null,
    history: query.data?.history ?? [],
    result: {
      ...formatPollResult(counts),
      total: Number(query.data?.total ?? 0),
      lastUpdated: query.data?.lastUpdated ?? null,
      source: "remote",
    },
    voteChoice: voteMutation.mutateAsync,
    clearVote: clearMutation.mutateAsync,
    isLoading: query.isLoading,
    isSaving: voteMutation.isPending || clearMutation.isPending,
    error: query.error ?? voteMutation.error ?? clearMutation.error,
    refetch: query.refetch,
    isRateLimited: (query.error?.status ?? voteMutation.error?.status) === 429,
    enabled: pollApiConfig.enabled,
  };
}
