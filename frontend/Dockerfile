FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY docker/entrypoint.sh /usr/local/bin/frontend-entrypoint
RUN chmod +x /usr/local/bin/frontend-entrypoint

EXPOSE 3000

ENTRYPOINT ["frontend-entrypoint"]
CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
