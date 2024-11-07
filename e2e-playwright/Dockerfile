FROM mcr.microsoft.com/playwright:v1.38.0-focal

WORKDIR /e2e-playwright

COPY . .

RUN npm install

CMD [ "npx", "playwright", "test", "--reporter=list" ]