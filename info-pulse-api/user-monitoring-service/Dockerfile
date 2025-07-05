FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod tidy

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o main .

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .
RUN chmod +x main

EXPOSE 3006

CMD ["./main"]