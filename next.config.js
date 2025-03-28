/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: "standalone", // Important for Docker deployment
    experimental: {
        // Add IPv6 support
        ipv6: true
    },
    // Allow cross-origin requests for PDF.js
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "credentialless",
                    },
                ],
            },
        ]
    },
}

module.exports = nextConfig

