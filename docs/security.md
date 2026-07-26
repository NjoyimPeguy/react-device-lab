# Iframe security

Previewing a URL creates a browser trust boundary. Treat both the host and
target as independent applications.

## Framing policy

Targets should use Content Security Policy `frame-ancestors` to allow only
trusted preview hosts. Do not remove clickjacking protection globally. A target
that sends `X-Frame-Options: DENY` or an incompatible CSP will not render; the
package does not bypass those headers.

The `sandbox` prop is passed directly to the iframe. Start with the fewest
capabilities the target requires. Combining `allow-scripts` and
`allow-same-origin` for same-origin content can substantially weaken sandbox
isolation. The `allow` prop should likewise grant only required features.

Set a restrictive `referrerPolicy` when the target must not receive the host
URL. Avoid placing secrets in preview URLs.

## Cross-origin bridge

- List exact HTTP(S) parent origins; wildcards are rejected.
- Install the bridge only in targets that intentionally cooperate.
- Keep `bridgeOrigins` equally narrow in the host.
- Validate configuration again before it affects sensitive application logic.
- Remove the bridge cleanup function when the target unmounts.

The protocol validates namespace, version, schema, source window, event origin,
and reported route origin. It does not authenticate users or authorize access to
application data.

## Untrusted targets

Do not frame untrusted sites from an authenticated host origin. Browser
extensions, downloads, navigation, storage, and target application behavior
remain outside this package’s control. Prefer a dedicated preview origin with
minimal credentials and no ambient authorization.

Report suspected package vulnerabilities through the process in
[SECURITY.md](../SECURITY.md), not a public issue.
