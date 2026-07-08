# Postman collection

Import both files into Postman: `VelvetHive.postman_collection.json` (the requests) and `VelvetHive.postman_environment.json` (variables), then select the "Velvet Hive - Local" environment in the top-right dropdown.

Before you start, open the environment and fill in:
- `superAdminPassword` - from `server/.env`'s `SUPER_ADMIN_PASSWORD`
- `paystackSecretKey` - from `server/.env`'s `PAYSTACK_SECRET_KEY` (only needed for the "Simulate Webhook" request)

Suggested run order (see `../API.md` for the full endpoint/security reference):

1. **Auth > Register** - creates your test account
2. Check Mailpit at `http://localhost:8025` for the verification email (run `docker run -p 1025:1025 -p 8025:8025 axllent/mailpit` first if it's not already running), copy the 6-digit code
3. **Auth > Verify Email** - paste the code in; this auto-captures your access token
4. **Auth > Login - Super Admin** - captures a separate Super Admin token, used by the Users folder and anywhere you need elevated access
5. **Users > Create Staff User** then **Login - Staff Admin** - creates and logs in as a plain ADMIN (not Super Admin), so you can see the RBAC difference first-hand: an ADMIN can manage products but gets 403 on Users endpoints and on creating orders
6. **Products / Orders** - browse the catalog, create an order (auto-captures `orderId`)
7. **Payments - Paystack > Initialize Payment** - hits the real Paystack sandbox, returns a checkout URL
8. **Payments - Paystack > Simulate Webhook** - simulates Paystack confirming the charge, without needing a public callback URL locally. This marks the order from step 6 PAID.
9. **Payments - M-Pesa > Create Order (for M-Pesa)** - an order can only be paid once, so this creates a *separate* order (captured as `mpesaOrderId`, not `orderId`) specifically for testing Daraja, rather than reusing the one Paystack just paid
10. **Payments - M-Pesa > STK Push** then **Simulate Callback** - same idea as Paystack, for Daraja

Postman's cookie jar handles the httpOnly `refreshToken` cookie automatically for `Auth > Refresh Token` / `Logout` - no manual cookie copying needed as long as you're hitting the same `baseUrl`.

**Variable scope note**: every token/id these requests capture (`accessToken`, `superAdminAccessToken`, `staffAdminAccessToken`, `orderId`, `paystackReference`, `checkoutRequestId`) is written with `pm.environment.set(...)` and lives in the environment file, not the collection. Postman resolves environment variables with higher precedence than collection variables — if you ever add a same-named variable at the collection level too, it'll silently shadow the one the scripts are actually updating (this bit us once already: `orderId` looked stuck at empty even though "Create Order" appeared to work).
