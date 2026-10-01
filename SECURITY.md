# Security

## Report a vulnerability

Email [support@flashdata.dev](mailto:support@flashdata.dev) with the affected version, impact, and a minimal reproduction using placeholder credentials. Do not post vulnerabilities, live API keys, storage credentials, signed result URLs, or private customer data in public issues. Revoke exposed credentials through the service that issued them.

This project is currently a release candidate. There are no published stable releases or security-support commitments for older versions yet. Report issues against the current candidate and use the latest reviewed release when it becomes available.

## Trust boundaries

- Each stdio process uses one FlashData API key configured by the local user. Treat the host and MCP client as trusted: they can access environment variables, tool arguments and tool results. Do not expose this process as a shared multi-user server.
- Custom API origins receive the configured key. Only configure origins you control or trust. Non-loopback API connections require HTTPS; redirects are disabled. Signed result downloads are restricted to the origin advertised by the authenticated Management API and do not receive the API key.
- Search results, transcripts, metadata and result manifests are untrusted external content. They are data, not instructions to reveal secrets or execute commands. Client and agent policies determine which tools may run; tool annotations are hints, not authorization or spending controls.
- Queries and downloads use the account's Credits. A timed-out submission may already be charged. The server does not automatically retry paid POSTs. Use a key with only the required source permissions and check current prices before authorizing a task.
- Download storage credentials are visible in MCP tool arguments and are sent to FlashData for the upload. An MCP client's conversation history or debug logs may retain them. Use dedicated, narrowly scoped, short-lived destination credentials where supported; avoid account-root or broadly privileged keys. Local secret management does not make tool arguments invisible to the client or agent.
- Large responses are cached in process memory with a four-result limit and a ten-minute TTL. Shutdown clears the cache. This is not encrypted archival storage; the client may independently retain results.

The MIT license covers this project. It does not grant access to FlashData services, customer data, or the private service implementation.
