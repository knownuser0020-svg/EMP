FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src src
RUN mvn -B package -DskipTests
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S forma && adduser -S forma -G forma
USER forma
WORKDIR /app
COPY --from=build /src/target/ems-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75.0","-jar","app.jar"]
