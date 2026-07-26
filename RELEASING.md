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
canonical repository. A credential-free job installs locked dependencies
without a release cache, runs the complete verification suite, confirms
tag/package/changelog agreement, packs the verified tarball, and transfers it as
an immutable workflow artifact. A separate protected job downloads that exact
artifact and invokes `npm publish --access public`.

## Trusted publishing setup

Configure npm’s trusted publisher for:

- GitHub owner: `NjoyimPeguy`
- repository: `react-device-lab`
- workflow filename: `release.yml`
- environment: `npm`
- allowed action: `npm publish`

The npm environment should require maintainer approval. Only the protected
publication job grants `contents: read` and job-scoped `id-token: write`; the
verification job cannot request an OIDC token. npm trusted publishing requires
npm 11.5.1+ and Node 22.14.0+, exchanges GitHub’s short-lived OIDC token, and
automatically adds provenance for a public package from a public repository.

The trusted publisher was configured after the one-time `v1.0.0` bootstrap.
The release workflow contains no npm token or GitHub secret reference. Every
future publication must authenticate only through the short-lived OIDC
credential issued for the exact repository, workflow, and environment above.

The verification job packs with lifecycle scripts disabled before the protected
publication job can request credentials. The publication job downloads and
publishes that exact immutable tarball with the npm 11.16.0 bundled by its pinned
Node 24.18.0 runtime and with lifecycle scripts disabled. It does not check out
the repository, install project dependencies, run lifecycle scripts, rebuild,
or retest under the OIDC permission.

Current authoritative references:

- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements/)
- [GitHub OIDC permissions](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub package publishing](https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages)

Keep traditional token publishing disabled in npm and do not add automation
tokens to GitHub. Do not test the workflow by publishing a throwaway version of
this package.
