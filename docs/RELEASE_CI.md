# Frontend release CI

The repository already has a GitHub Pages workflow. That workflow publishes the
`gh-pages` branch and does not update the static directory served by the
production host at `https://oj.qd.sdu.edu.cn/v2/`.

`release.yml` adds the production path:

1. Run the reusable quality workflow.
2. Build with Node 24 and Yarn 1.22.22.
3. Check that the `/v2/` bundle contains an entrypoint.
4. Upload the build as a 30-day artifact.
5. On a `web2-v*` tag, or after selecting **Deploy** in a manual run, publish the
   verified files over SSH and rsync.
6. Fetch the configured production URL and check the HTML root after publishing.

The deploy job is attached to the `production` environment. Configure required
reviewers there before enabling automatic tag releases.

## Production environment configuration

Create these secrets under the repository's `production` environment:

| Secret                     | Value                                                    |
| -------------------------- | -------------------------------------------------------- |
| `SDUOJ_DEPLOY_HOST`        | SSH host for the machine serving the frontend            |
| `SDUOJ_DEPLOY_USER`        | Dedicated deployment user                                |
| `SDUOJ_DEPLOY_SSH_KEY`     | Private key for that user, stored only in GitHub Secrets |
| `SDUOJ_DEPLOY_KNOWN_HOSTS` | Exact `known_hosts` line(s) for the SSH host             |
| `SDUOJ_DEPLOY_PATH`        | Existing writable Nginx static directory for `/v2/`      |

The path must be the directory that contains `index.html` for the `/v2/` site.
The workflow refuses system roots and paths containing shell metacharacters. The
deployment account should have write access only to this directory.

Set the optional `SDUOJ_RELEASE_URL` environment variable to override the default
smoke-test URL. The default is `https://oj.qd.sdu.edu.cn/v2/`.

## Running a release

Use a tag such as `web2-v2026.10.02` for the normal release path. GitHub Actions
will wait for the `production` environment approval, if required, before the SSH
step. A manual run can build and retain an artifact without deploying; select the
`deploy` input only after the production secrets and path have been verified.

The current workstation can read the live frontend over HTTPS, but it has not
verified SSH access to the production machine. The first deployment should be
performed with the environment approval enabled and checked against the live
`/v2/` URL.
