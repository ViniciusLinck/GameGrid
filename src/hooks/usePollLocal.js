import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearPollVote,
  getClientId,
  getPollLocalSnapshot,
  savePollVote,
} from "../services/pollStorage";
import { formatPollResult } from "../utils/pollUtils";

export function usePollLocal(matchId) {
  const queryClient = useQueryClient();
  const queryKey = ["poll-local", String(matchId)];

  const query = useQuery({
    queryKey,
    queryFn: () => getPollLocalSnapshot(matchId),
    enabled: Boolean(matchId),
    staleTime: 0,
  });

  const voteMutation = useMutation({
    mutationFn: (choice) => savePollVote(matchId, choice),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearPollVote(matchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const snapshot = query.data ?? {
    vote: null,
    history: [],
    counts: { home: 0, draw: 0, away: 0 },
    total: 0,
    lastUpdated: null,
  };

  return {
    mode: "local",
    clientId: getClientId(),
    vote: snapshot.vote,
    history: snapshot.history,
    result: {
      ...formatPollResult(snapshot.counts),
      lastUpdated: snapshot.lastUpdated,
      source: "local",
    },
    voteChoice: voteMutation.mutateAsync,
    clearVote: clearMutation.mutateAsync,
    isLoading: query.isLoading,
    isSaving: voteMutation.isPending || clearMutation.isPending,
    error: query.error ?? voteMutation.error ?? clearMutation.error,
    refetch: query.refetch,
  };
}
