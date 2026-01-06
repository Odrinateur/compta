import { type NextConfig } from "next";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "src/env";

/** @type {import("next").NextConfig} */
const config: NextConfig = {
    output: "standalone",
    experimental: {
        serverActions: {
            bodySizeLimit: "10mb",
        },
    },
};

export default config;
