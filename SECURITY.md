# Security policy

## Supported versions

Until the first stable release, only the latest published version will receive
security fixes. This file does not imply that a package has already been
published.

## Reporting a vulnerability

Use GitHub private vulnerability reporting for this repository. If that feature
is unavailable, contact the repository maintainer privately through the contact
method on their GitHub profile. Do not include exploit details, credentials,
private URLs, or user data in a public issue.

Include the affected version or commit, impact, reproduction, and any suggested
mitigation. A maintainer should acknowledge a complete report within seven days
and coordinate disclosure after a fix is available.

## Security scope

High-priority areas include cross-origin message validation, iframe sandbox and
permission behavior, route URL handling, unsafe DOM access, package supply
chain, and accidental publication of secrets or private application data.

This package does not bypass a target’s Content Security Policy,
`X-Frame-Options`, same-origin policy, authentication, or authorization.
Consumers must configure framing and bridge origins according to
[the iframe security guide](docs/security.md).
