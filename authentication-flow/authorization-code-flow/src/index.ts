import express from "express";
import session from "express-session";
import jwt from "jsonwebtoken";

const app = express();

app.get("/login", (req, res) => {

  // valor aleatório - sessão de usuário
  const loginParams = new URLSearchParams({
    client_id: "fullcycle-client",
    redirect_uri: "http://localhost:3000/callback",
    response_type: "code",
    scope: "openid",
  });

  const url = `http://localhost:8080/realms/fullcycle-realm/protocol/openid-connect/auth?${loginParams.toString()}`;
  console.log(url);
  res.redirect(url);
});

app.get("/logout", (req, res) => {
  const logoutParams = new URLSearchParams({
    //client_id: "fullcycle-client",
    //@ts-expect-error
    id_token_hint: req.session.id_token,
    post_logout_redirect_uri: "http://localhost:3000/login",
  });

  req.session.destroy((err) => {
    console.error(err);
  });

  const url = `http://localhost:8080/realms/fullcycle-realm/protocol/openid-connect/logout?${logoutParams.toString()}`;
  res.redirect(url);
});
// /login ----> keycloak (formulario de auth) ----> /callback?code=123 ---> keycloak (devolve o token)
//
app.get("/callback", async (req, res) => {

  const bodyParams = new URLSearchParams({
    client_id: "fullcycle-client",
    grant_type: "authorization_code",
    code: req.query.code as string,
    redirect_uri: "http://localhost:3000/callback",
  });

  const url = `http://localhost:8080/realms/fullcycle-realm/protocol/openid-connect/token`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams.toString(),
  });

  const result = await response.json();

  console.log(result);



  res.json(result);
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
