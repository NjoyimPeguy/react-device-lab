# Release process

No release or npm publication is automatic during ordinary CI. Publication is
prepared for a future, explicitly authorized maintainer action.

## Version policy

The project follows Semantic Versioning:

- patch: compatible fixes and corrected preset facts;
- minor: compatible features, new presets, and additive public API;
- major: incompatible API, CSS contract, or behavioral changes.

Before `1.0.0`, call out any intentional breaking change prominently. Never
reuse a device preset ID for different hardware.

## Maintainer checklist

1. Update `CHANGELOG.md` and `package.json` to the intended version.
2. Run `npm ci`, `npm run verify`, and the packed-consumer verification.
3. Inspect `npm pack --dry-run --json` and the generic screenshots.
4. Confirm the public repository URL exactly matches `package.json`.
5. Commit the release preparation through normal review.
6. Create a GitHub Release tagged exactly `v<package version>`.
7. Publish that release only after explicit approval.
8. Verify npm provenance and run `npm audit signatures` in a clean consumer.

The `release.yml` workflow runs only for a published GitHub Release in the
canonical repository. It installs locked dependencies without a release cache,
runs the complete verification suite, confirms tag/package/changelog agreement,
and then invokes `npm publish --access public`.

## Trusted publishing setup

Configure npm’s trusted publisher for:

- GitHub owner: `NjoyimPeguy`
- repository: `react-device-lab`
- workflow filename: `release.yml`
- environment: `npm`
- allowed action: `npm publish`

The npm environment should require maintainer approval. The workflow grants
`contents: read` and job-scoped `id-token: write`; it has no npm token. npm
trusted publishing requires npm 11.5.1+ and Node 22.14.0+, exchanges GitHub’s
short-lived OIDC token, and automatically adds provenance for a public package
from a public repository.

The package name is currently unregistered. npm’s trusted-publisher controls are
documented under an existing package’s settings. Before the first publication,
confirm npm’s current new-package bootstrap flow. If the settings are not
available until ownership exists, perform any required one-time bootstrap only
as an explicitly authorized maintainer action, then configure trusted publishing
before enabling later automated releases. Do not add a long-lived publish token
to `release.yml`.

Current authoritative references:

- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements/)
- [GitHub OIDC permissions](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub package publishing](https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages)

After the first successful trusted publish, restrict traditional token
publishing in npm and remove unused automation tokens. Do not test the workflow
by publishing a throwaway version of this package.
