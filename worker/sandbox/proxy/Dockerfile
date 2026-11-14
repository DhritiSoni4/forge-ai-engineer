FROM node:22-alpine
COPY proxy.mjs /proxy.mjs
USER node
ENV PORT=3128
CMD ["node", "/proxy.mjs"]
