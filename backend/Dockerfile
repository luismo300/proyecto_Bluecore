# ---------- Etapa 1: compilación ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Las dependencias se resuelven en una capa aparte: mientras el pom.xml no
# cambie, Docker reutiliza la caché y no vuelve a descargar Maven Central.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- Etapa 2: ejecución ----------
FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app

# Usuario sin privilegios: nada aquí necesita root.
RUN useradd --system --create-home --shell /usr/sbin/nologin bluecore
USER bluecore

COPY --from=build --chown=bluecore:bluecore /build/target/*.jar app.jar

EXPOSE 8080

# Ajusta el heap al límite de memoria del contenedor en lugar de al de la máquina.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
