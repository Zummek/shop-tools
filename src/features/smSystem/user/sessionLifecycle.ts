/** Bumped on logout so in-flight refresh cannot revive a cleared session. */
let sessionGeneration = 0;

let refreshInFlight: Promise<string | undefined> | null = null;

export const getSessionGeneration = () => sessionGeneration;

export const invalidateSessionLifecycle = () => {
  sessionGeneration += 1;
  refreshInFlight = null;
};

export const getRefreshInFlight = () => refreshInFlight;

export const setRefreshInFlight = (
  promise: Promise<string | undefined> | null,
) => {
  refreshInFlight = promise;
};
