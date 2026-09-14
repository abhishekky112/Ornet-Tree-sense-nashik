```sh
serena start-mcp-server --transport streamable-http --port 8000  --project-from-cwd
```

```sh
cloudflared tunnel --http-host-header localhost:8000 --url http://localhost:8000 
```

# new project

```sh
serena start-mcp-server --transport streamable-http --port 8000 --project "D:\abhishek_project\ornet"
```