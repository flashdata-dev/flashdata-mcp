# FlashData hosted MCP registration

[`server.json`](server.json) describes the hosted FlashData service for the
[Official MCP Registry](https://registry.modelcontextprotocol.io/), under
`io.github.flashdata-dev/flashdata`.

This is a **remote-only** registration. It connects clients to
`https://data.flashdata.dev/mcp` over Streamable HTTP. The open-source stdio
client in this repository calls the REST APIs separately; the hosted server's
implementation is not included here. No npm package is required for this
registration, and it does not announce an npm release.

## Connect and verify

1. Create a FlashData account and obtain an API key in
   [the console](https://flashdata.dev/app/api-keys).
2. Configure a client that supports Streamable HTTP and custom headers with
   the endpoint above and an `X-API-Key` header containing your key. See the
   [client-specific setup instructions](https://flashdata.dev/mcp).
3. Ask the client to list the available FlashData tools, then check your
   balance, pricing and account limits. These account reads do not submit
   paid data queries.

For example, Cursor's MCP configuration uses:

```json
{
  "mcpServers": {
    "flashdata": {
      "url": "https://data.flashdata.dev/mcp",
      "headers": { "X-API-Key": "YOUR_API_KEY" }
    }
  }
}
```

Keep the real key in your client's protected configuration. The public
Registry metadata contains only the header definition, never a key value.
An unauthenticated POST returns 401; opening the endpoint with a browser GET
returns 405. A failed browser GET alone does not indicate an MCP outage.

With a key authorized for all sources, the service exposes 22 tools: Google
search, YouTube discovery and data, media downloads, batch submission, result
retrieval, and account reads. Tool availability follows the key's scopes.
Transcripts require an existing caption track. Downloads run asynchronously
and deliver to customer-provided storage. Data queries use the account's
Credits; media downloads are billed by uploaded bytes. See
[current pricing](https://flashdata.dev/pricing).

## Publish an update

The **Official MCP Registry** GitHub Actions workflow validates the manifest
on relevant pushes and pull requests. Publishing requires explicitly running
the workflow from `main`; pushes and pull requests do not publish.

1. Update `server.json` and increase its version for a new registration
   revision. The Registry version is maintained separately from the local
   npm package version.
2. Review and merge the change after validation passes.
3. Run **Actions → Official MCP Registry → Run workflow**, selecting `main`.
4. Check the publish job and its public Registry response. Record the
   returned publication timestamp and verify the remote connection before
   reporting the channel as live.

Publishing uses GitHub Actions OIDC with `contents: read` and `id-token: write`.
No GitHub PAT, npm token, or FlashData API key is stored in the workflow.
The publisher binary is pinned and checked against its release SHA-256.

The canonical public lookup is:

<https://registry.modelcontextprotocol.io/v0.1/servers/io.github.flashdata-dev%2Fflashdata/versions/latest>

That URL is a verification target, not a claim that an unsubmitted revision
is already live. Registry publication makes metadata available to downstream
catalogs; it does not guarantee inclusion in an individual client's marketplace.

## Official references

- [Remote servers and required headers](https://modelcontextprotocol.io/registry/remote-servers)
- [Remote-only publishing](https://modelcontextprotocol.io/registry/quickstart)
- [Namespace authentication](https://modelcontextprotocol.io/registry/authentication)
- [GitHub Actions OIDC](https://modelcontextprotocol.io/registry/github-actions)
