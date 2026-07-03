/**
 * Configurable business rules.
 *
 * The brief is explicit: distance thresholds, GPS intervals, ETA windows,
 * arrival radius, hold periods, commission %, cancellation penalties, etc.
 * must be CONFIGURABLE SETTINGS, not hard-coded values. In production these
 * are intended to be persisted in a `Settings` collection and editable from
 * the admin portal; here we expose them as a single typed object with
 * sensible defaults drawn directly from the feature specs.
 *
 * TODO(platform): back this with a Mongo `settings` doc + admin CRUD so values
 * can be changed at runtime without a redeploy.
 */
export interface PlatformSettings {
  /** Commission taken by the platform on call-out / recovery fee (fraction). */
  commissionRate: number;
  /** Currency for all marketplace pricing. */
  currency: 'GBP';

  pricing: {
    roadsideAssistance: number; // £50
    recovery: number; // £80
    unsure: number; // £100
    /** Refund if the "Unsure" job only needed assistance. */
    unsureAssistanceOnlyRefund: number; // £50
  };

  tracking: {
    /** How often providers push GPS, in seconds (spec: 30–60s). */
    gpsUpdateIntervalSeconds: number;
    /** How often the provider app transmits GPS while on an active job (seconds). */
    providerPingSeconds: number;
    /** How often consumers refresh the ORS route/ETA while a map is open (seconds). */
    routeRefreshSeconds: number;
    /** Assumed average speed for the cheap straight-line ETA fallback (m/s). */
    assumedSpeedMps: number;
    /** Auto-mark "arrived" within this radius of the customer (metres). */
    arrivalRadiusMeters: number;
  };

  escrow: {
    /** Auto-release funds this long after arrival unless disputed (minutes). */
    autoReleaseAfterArrivalMinutes: number;
    /** Customer window to confirm/dispute after arrival (minutes). */
    disputeWindowMinutes: number;
  };

  cancellation: {
    /** Penalty after a provider accepts but before arrival (fraction of fee). */
    postAcceptancePenaltyRate: number; // 0.50
    /** Share of the penalty paid to the provider. */
    providerPenaltyShare: number; // 0.45
    /** Share of the penalty retained by the platform. */
    platformPenaltyShare: number; // 0.05
  };

  assistance: {
    /** Free on-scene assessment window for standard jobs (minutes). */
    windowMinutes: number; // 30
    /** Shorter window for the "Unsure" option (minutes). */
    unsureWindowMinutes: number; // 15
  };

  recovery: {
    /** Mileage included before extra mileage applies (miles). */
    includedMiles: number; // 10
  };

  dispatch: {
    /** Max radius to search for an available provider (km). */
    searchRadiusKm: number;
    /** Grace period before auto-suspending an unresponsive provider (seconds). */
    acceptanceGraceSeconds: number;
  };

  documents: {
    /** Expiry reminder offsets, in days before expiry. */
    expiryReminderDays: number[];
  };

  chat: {
    /** Archive retention before automatic deletion (months). */
    retentionMonths: number;
  };
}

export const settings: PlatformSettings = {
  commissionRate: 0.05,
  currency: 'GBP',

  pricing: {
    roadsideAssistance: 50,
    recovery: 80,
    unsure: 100,
    unsureAssistanceOnlyRefund: 50,
  },

  tracking: {
    gpsUpdateIntervalSeconds: 45,
    providerPingSeconds: 5,
    routeRefreshSeconds: 15,
    assumedSpeedMps: 11, // ~25 mph
    arrivalRadiusMeters: 100,
  },

  escrow: {
    autoReleaseAfterArrivalMinutes: 60,
    disputeWindowMinutes: 60,
  },

  cancellation: {
    postAcceptancePenaltyRate: 0.5,
    providerPenaltyShare: 0.45,
    platformPenaltyShare: 0.05,
  },

  assistance: {
    windowMinutes: 30,
    unsureWindowMinutes: 15,
  },

  recovery: {
    includedMiles: 10,
  },

  dispatch: {
    searchRadiusKm: 40,
    acceptanceGraceSeconds: 120,
  },

  documents: {
    expiryReminderDays: [28, 7, 0],
  },

  chat: {
    retentionMonths: 12,
  },
};
