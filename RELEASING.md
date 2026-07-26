# Release process

No release or npm publication is automatic during ordinary CI. Publication is
prepared for a future, explicitly authorized maintainer action.

## Version policy

The project follows Semantic Versioning:

- patch: compatible fixes and corrected preset facts;
- minor: compatible features, new presets, and additive public API;
- major: incompatible API, CSS contract, or behavioral changes.

Starting with `1.0.0`, incompatible public API or CSS contract changes require a
new major version. Never reuse a device preset ID for different hardware.

## Maintainer checklist

1. Update `CHANGELOG.md` and `package.json` to the intended version.
2. Run `npm ci`, `npm run verify`, and the packed-consumer verification. The
   verification suite builds the TypeDoc site and treats missing public API
   documentation or broken links as errors.
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
`contents: read` and job-scoped `id-token: write`. npm trusted publishing
requires npm 11.5.1+ and Node 22.14.0+, exchanges GitHub’s short-lived OIDC
token, and automatically adds provenance for a public package from a public
repository.

The package name is currently unregistered. npm’s trusted-publisher controls are
documented under an existing package’s settings. Before the first publication,
use this one-time bootstrap:

1. Create a short-expiry granular npm access token with read/write package
   permission and bypass 2FA enabled. Because the package does not exist yet,
   npm may require the token to cover all packages temporarily.
2. Store it only as the `NPM_BOOTSTRAP_TOKEN` secret in the protected GitHub
   `npm` environment. Never store it in the repository or a repository-wide
   secret.
3. Publish the `v1.0.0` GitHub Release. The release workflow runs in GitHub
   Actions, packs the already-verified artifact without lifecycle scripts, and
   publishes that exact tarball without lifecycle scripts. The write token is
   therefore available only to the registry call, and the first package
   publication includes npm provenance.
4. Configure the package’s trusted publisher with the values above.
5. Delete the `NPM_BOOTSTRAP_TOKEN` environment secret and revoke the npm token
   immediately.
6. Remove the temporary `NODE_AUTH_TOKEN` fallback from `release.yml` in a
   reviewed cleanup commit. Later releases authenticate only through OIDC.

The npm CLI checks the GitHub OIDC identity before falling back to the temporary
bootstrap token. A token-free workflow is the required steady state after
`v1.0.0`; do not add a long-lived publish token.

Current authoritative references:

- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements/)
- [GitHub OIDC permissions](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub package publishing](https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages)

After the first successful trusted publish, restrict traditional token
publishing in npm and remove unused automation tokens. Do not test the workflow
by publishing a throwaway version of this package.
