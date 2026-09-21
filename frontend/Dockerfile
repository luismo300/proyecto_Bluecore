# ---------- Etapa 1: compilación ----------
FROM node:22-alpine AS build
WORKDIR /build

# npm ci exige el lockfile y produce instalaciones reproducibles.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Etapa 2: ejecución ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Solo las dependencias de producción: el servidor SSR necesita Express en tiempo
# de ejecución, pero nada del utillaje de compilación.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# El bundle de servidor resuelve ../browser desde su propia ruta, así que se
# copia el árbol dist completo, no solo server/.
COPY --from=build /build/dist ./dist

# La imagen de Node ya trae el usuario "node" sin privilegios.
USER node

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/frontend/server/server.mjs"]
