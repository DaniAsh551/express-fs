# pull official base image
FROM node:18-alpine as app

# set working directory
WORKDIR /app

# add deps
RUN apk add curl

# set PNPM params
ENV PNPM_HOME /usr/local/share/pnpm

# set PATH
ENV PATH /app/node_modules/.bin:/usr/local/share/pnpm:$PATH

# install pnpm
RUN curl -sL https://unpkg.com/@pnpm/self-installer | node

# install vite
RUN pnpm install -g vite

# expose port 3000
EXPOSE 3000

# start app
CMD ["/bin/sh", "-c", "pnpm install;pnpm run dev"]
