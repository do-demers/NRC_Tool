FROM nginx:1.17.3

# Set environment varibles
ENV TZ America/Toronto

# Make /var/cache/nginx/ writable by non-root users
RUN chgrp nginx /var/cache/nginx/
RUN chmod -R g+w /var/cache/nginx/

# Run as port 8080, which is available to non-root users allows us to drop
# all remaining root capabilities from the container, which improves security.
RUN sed --regexp-extended --in-place=.bak 's%(^\s+listen\s+)80(;)%\178080\2%' /etc/nginx/conf.d/default.conf
EXPOSE 8080

# Write the PID file to a location where regular users have write access.
RUN sed --regexp-extended --in-place=.bak 's%^pid\s+/var/run/nginx.pid;%pid /var/tmp/nginx.pid;%' /etc/nginx/nginx.conf

# Copy the nginx configuration
#COPY ./nginx/nginx-server.conf /etc/nginx/conf.d/default.conf

# Copy NRC frontend files
COPY  ./NRC_Tool /usr/share/nginx/html

USER nginx
