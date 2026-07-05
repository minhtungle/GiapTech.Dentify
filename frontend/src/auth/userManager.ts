import { UserManager, WebStorageStateStore } from "oidc-client-ts"

const authority = import.meta.env.VITE_AUTHORITY as string
const clientId = import.meta.env.VITE_CLIENT_ID as string
const scope = import.meta.env.VITE_SCOPE as string

export const userManager = new UserManager({
  authority,
  client_id: clientId,
  redirect_uri: `${window.location.origin}/auth-callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
})
