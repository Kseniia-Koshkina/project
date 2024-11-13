To run application :

Develop:
- docker-compose up

Production:
- docker compose -f docker-compose.prod.yml --profile migrate --profile pgadmin up -d

Run tests:
- docker compose run --entrypoint=npx e2e-playwright playwright test && docker compose rm -sf