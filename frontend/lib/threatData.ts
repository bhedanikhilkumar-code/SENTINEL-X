export interface ActorData {
  id: string;
  codename: string;
  realIdentity: string;
  threatLevel: "CRITICAL" | "HIGH" | "ELEVATED";
  threatType: string;
  attributionConfidence: number;
  status: "DE-CLOAKED" | "TRACKING" | "CONTAINED";
  location: {
    city: string;
    country: string;
    countryCode: string;
    timezone: string;
    utcOffset: string;
    lat: number;
    lng: number;
    isp: string;
    asn: string;
  };
  aliases: string[];
  clearnetFootprint: {
    platform: "github" | "keybase" | "telegram" | "twitter";
    handle: string;
    url: string;
    confidence: number;
  }[];
  darknetEvidence: {
    forum: string;
    postTitle: string;
    timestamp: string;
    rawSnippet: string;
  };
  clearnetEvidence: {
    repo: string;
    commitHash: string;
    timestamp: string;
    rawSnippet: string;
  };
  pgpArtifact: {
    keyId: string;
    fingerprint: string;
    createdDate: string;
    algorithm: string;
    rawBlock: string;
    clearnetMatchRepo: string;
  };
  cryptoEvidence: {
    currency: string;
    amount: string;
    victimWallet: string;
    intermediaryHop: string;
    exchangeDeposit: string;
    exchangeName: string;
    txHash: string;
    clusterTag: string;
  };
  infraLeak: {
    vpsIp: string;
    sshFingerprint: string;
    censysBanner: string;
    openPorts: number[];
  };
  stylometry: {
    overallSimilarity: number;
    metrics: {
      metric: string;
      darknetValue: number;
      clearnetValue: number;
      correlation: number;
    }[];
    hourlyActivity: {
      hourUtc: number;
      activityPercentage: number;
    }[];
    inferredSleepWindowUtc: string;
  };
  arcs: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string;
    label: string;
    nodeType: string;
    asn: string;
    ip: string;
  }[];
}

export const TARGET_ACTORS: Record<string, ActorData> = {
  "phantom-krypt": {
    id: "phantom-krypt",
    codename: "PHANTOM-KRYPT",
    realIdentity: "Pavel K. (@px-ops)",
    threatLevel: "CRITICAL",
    threatType: "Critical Infrastructure Ransomware Broker",
    attributionConfidence: 94.8,
    status: "DE-CLOAKED",
    location: {
      city: "Bucharest",
      country: "Romania",
      countryCode: "RO",
      timezone: "Eastern European Summer Time (EEST)",
      utcOffset: "UTC+3",
      lat: 44.4268,
      lng: 26.1025,
      isp: "Voxility S.R.L. Autonomous System",
      asn: "AS3223",
    },
    aliases: ["Phantom_Krypt", "px-ops", "phantom_dev", "krypt_operator"],
    clearnetFootprint: [
      {
        platform: "github",
        handle: "px-ops",
        url: "https://github.com/px-ops",
        confidence: 0.96,
      },
      {
        platform: "keybase",
        handle: "phantom_sec",
        url: "https://keybase.io/phantom_sec",
        confidence: 0.98,
      },
      {
        platform: "telegram",
        handle: "@phantom_ops_channel",
        url: "https://t.me/phantom_ops_channel",
        confidence: 0.88,
      },
      {
        platform: "twitter",
        handle: "@px_security",
        url: "https://x.com/px_security",
        confidence: 0.82,
      },
    ],
    darknetEvidence: {
      forum: "Dread /d/DarknetMarketNoobs & RansomExx Leak Site",
      postTitle: "Ransomware Extortion Notice #IND-GRID-04",
      timestamp: "2026-08-14 04:22:18 UTC",
      rawSnippet:
        "Notice of network compromise: All primary SCADA operational pipelines, SCADA telemetry relays, and oracle database servers for Indian regional power grid sector 4 are encrypted with military-grade ChaCha20-Poly1305. Payment demand: 45 BTC to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh. Contact strictly via PGP; do NOT attempt manual recovery or tamper with telemetry relays -- you have 72 hours before private keys are permanently purged.",
    },
    clearnetEvidence: {
      repo: "github.com/px-ops/mesh-crypto-tunnel",
      commitHash: "c89f21ab047d91e32",
      timestamp: "2026-03-21 11:14:02 UTC",
      rawSnippet:
        "commit c89f21ab047d91e32 (HEAD -> main)\nAuthor: Pavel K. <px-ops@proton.me>\nDate:   Sat Mar 21 14:14:02 2026 +0300\n\n    fix(core): optimize chacha20 poly1305 buffer pipeline; avoid mutex contention on telemetry relays\n    \n    // Notice of network optimization: always preserve oracle buffer sanity;\n    // do NOT attempt manual re-sync without verifying key.\n    // Telemetry relays must flush buffers sequentially -- avoid premature exit.",
    },
    pgpArtifact: {
      keyId: "0x9B4EA81C",
      fingerprint: "9B4E 2A18 F07C 33D1 B294 E7A1 4C82 195F 0x9B4EA81C",
      createdDate: "2025-01-19 14:30:00 UTC",
      algorithm: "RSA 4096-bit (Sign/Encrypt)",
      rawBlock:
        "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: OpenPGP v4.2.0\nmQINBF+3u4sBEADF9wO8Z29eE7x9bC4k1ZpLmNpQrstUvWxyzABCD1234567890\n9B4E2A18F07C33D1B294E7A14C82195F9B4EA81C==pxops\n-----END PGP PUBLIC KEY BLOCK-----",
      clearnetMatchRepo:
        "Matches GPG commit signature on github.com/px-ops/mesh-crypto-tunnel (Key ID 0x9B4EA81C)",
    },
    cryptoEvidence: {
      currency: "Bitcoin (BTC)",
      amount: "45.0 BTC (~$2,790,000 USD)",
      victimWallet: "bc1q84z98a2mptl5slmv7divfna4091v2",
      intermediaryHop: "3K98fvGzM5dE7x4B9Qvi2ecrnyiWrnqRhW (Wasabi CoinJoin Mixer)",
      exchangeDeposit: "1NDyJtNTjW4P2ndJnTqngRtihWCnqRhWNLy",
      exchangeName: "Binance Seychelles Ltd (Deposit Cluster 0x89F2)",
      txHash: "7f4c9a81b2e403d98f71aa5c023d88194bcf982e01a48c903ef8912ba77d4091",
      clusterTag: "btc_co_spend_syndicate_cluster_4091",
    },
    infraLeak: {
      vpsIp: "185.220.101.4",
      sshFingerprint: "SHA256:4t/uP7eX9f2Z9qL8a0Vm5N1bC3kE4gH7iJ0lO2rS5uY",
      censysBanner: "OpenSSH 8.9p1 Ubuntu-3ubuntu0.6; Node: voxility-ro-04.net",
      openPorts: [22, 80, 443, 9050],
    },
    stylometry: {
      overallSimilarity: 96.2,
      metrics: [
        { metric: "Vocabulary Richness", darknetValue: 0.78, clearnetValue: 0.76, correlation: 97.4 },
        { metric: "Semicolon Freq", darknetValue: 0.84, clearnetValue: 0.82, correlation: 97.6 },
        { metric: "Em-Dash Usage", darknetValue: 0.91, clearnetValue: 0.89, correlation: 97.8 },
        { metric: "Imperative Constructs", darknetValue: 0.95, clearnetValue: 0.94, correlation: 98.9 },
        { metric: "Jargon Co-occurrence", darknetValue: 0.96, clearnetValue: 0.95, correlation: 99.0 },
      ],
      hourlyActivity: [
        { hourUtc: 0, activityPercentage: 2 }, { hourUtc: 7, activityPercentage: 42 },
        { hourUtc: 12, activityPercentage: 94 }, { hourUtc: 18, activityPercentage: 38 },
        { hourUtc: 23, activityPercentage: 1 },
      ],
      inferredSleepWindowUtc: "22:00 – 05:00 UTC (01:00 – 08:00 Local EEST)",
    },
    arcs: [
      {
        startLat: 50.1109, startLng: 8.6821, endLat: 52.3676, endLng: 4.9041,
        color: "#00f0ff", label: "Hop 1 (Tor Circuit): Frankfurt Guard -> Amsterdam Exit",
        nodeType: "Tor Middle & Exit Relay", asn: "AS3320 -> AS1103", ip: "185.220.101.4",
      },
      {
        startLat: 52.3676, startLng: 4.9041, endLat: 44.4268, endLng: 26.1025,
        color: "#ff0055", label: "Hop 2 (De-cloaked VPS C2): Amsterdam Exit -> Bucharest VPS",
        nodeType: "De-cloaked SSH VPS C2 Origin", asn: "AS3223 (Voxility)", ip: "185.220.101.4",
      },
      {
        startLat: 44.4268, startLng: 26.1025, endLat: -4.6796, endLng: 55.492,
        color: "#ffaa00", label: "Hop 3 (Financial Off-ramp): Bucharest -> Binance Seychelles",
        nodeType: "Centralized Exchange Deposit", asn: "AS13335 (Binance)", ip: "1NDyJtNTjW4P...",
      },
    ],
  },
  "void-locker": {
    id: "void-locker",
    codename: "VOID-LOCKER",
    realIdentity: "Unknown (UTC+8 inferred, East Asia cluster)",
    threatLevel: "HIGH",
    threatType: "Healthcare Data Exfiltration Syndicate",
    attributionConfidence: 61.3,
    status: "TRACKING",
    location: {
      city: "Hong Kong / Taipei Area",
      country: "East Asia Region",
      countryCode: "HK",
      timezone: "China Standard Time (CST)",
      utcOffset: "UTC+8",
      lat: 22.3193,
      lng: 114.1694,
      isp: "HKBN Enterprise Solutions",
      asn: "AS9269",
    },
    aliases: ["@void_lock", "@vl_operator", "null_ptr_v"],
    clearnetFootprint: [
      {
        platform: "telegram",
        handle: "@void_lock",
        url: "https://t.me/void_lock",
        confidence: 0.68,
      },
      {
        platform: "github",
        handle: "@vl_operator",
        url: "https://github.com/vl_operator",
        confidence: 0.62,
      },
    ],
    darknetEvidence: {
      forum: "BreachForums v2 (.onion)",
      postTitle: "Healthcare Diagnostic Records Database Dump",
      timestamp: "2026-07-29 02:15:00 UTC",
      rawSnippet:
        "340,000 healthcare patient records leaked. Payment in ETH / USDT: 0xAb3f2810233D1B294E7A14C82195F0xAb3f8102. Encryption keys released upon 30,000 USD transfer.",
    },
    clearnetEvidence: {
      repo: "github.com/vl_operator/exfil-poc",
      commitHash: "a1209b55e81d7",
      timestamp: "2026-02-10 18:40:12 UTC",
      rawSnippet:
        "// Target ETH test address: 0xAb3f2810233D1B294E7A14C82195F0xAb3f8102",
    },
    pgpArtifact: {
      keyId: "0x4F1B9C7A",
      fingerprint: "4F1B 9C7A 8102 33D1 B294 E7A1 4C82 195F 0x4F1B9C7A",
      createdDate: "2025-05-10 09:00:00 UTC",
      algorithm: "RSA 3072-bit",
      rawBlock: "-----BEGIN PGP PUBLIC KEY BLOCK-----\n...\n-----END PGP PUBLIC KEY BLOCK-----",
      clearnetMatchRepo: "Matches Keybase identity @void_intel",
    },
    cryptoEvidence: {
      currency: "Ethereum (ETH)",
      amount: "18.5 ETH (~$55,000 USD)",
      victimWallet: "0xAb3f2810233D1B294E7A14C82195F0xAb3f8102",
      intermediaryHop: "Tornado Cash Relayer Proxy",
      exchangeDeposit: "0xAb3f2810233D1B294E7A14C82195F0xAb3f8102",
      exchangeName: "OKX Global Off-ramp",
      txHash: "0x89abf2140d39e14a89bc2130e981294bcda8912ba77d4091",
      clusterTag: "eth_tornado_cluster_8102",
    },
    infraLeak: {
      vpsIp: "109.92.144.18",
      sshFingerprint: "SHA256:vN4kP7eX9f2Z9qL8a0Vm5N1bC3kE4gH7iJ0lO2rS5uY",
      censysBanner: "OpenSSH 8.4p1 Debian-5+deb11u1",
      openPorts: [22, 8080],
    },
    stylometry: {
      overallSimilarity: 71.4,
      metrics: [
        { metric: "Vocabulary Richness", darknetValue: 0.71, clearnetValue: 0.69, correlation: 81.2 },
        { metric: "Punctuation Profile", darknetValue: 0.77, clearnetValue: 0.74, correlation: 78.5 },
      ],
      hourlyActivity: [
        { hourUtc: 0, activityPercentage: 35 }, { hourUtc: 8, activityPercentage: 80 },
        { hourUtc: 16, activityPercentage: 55 }, { hourUtc: 23, activityPercentage: 10 },
      ],
      inferredSleepWindowUtc: "16:00 – 23:00 UTC (00:00 – 07:00 Local CST)",
    },
    arcs: [
      {
        startLat: 50.1109, startLng: 8.6821, endLat: 52.3676, endLng: 4.9041,
        color: "#00f0ff", label: "Tor Circuit", nodeType: "Tor", asn: "AS3320", ip: "109.92.144.18",
      },
      {
        startLat: 52.3676, startLng: 4.9041, endLat: 22.3193, endLng: 114.1694,
        color: "#ff0055", label: "Exit -> East Asia Cluster", nodeType: "Origin", asn: "AS9269", ip: "109.92.144.18",
      },
    ],
  },
};
