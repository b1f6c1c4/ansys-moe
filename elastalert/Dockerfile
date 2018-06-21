# ansys-moe: Computer-automated Design System
# Copyright (C) 2018  Jinzheng Tu
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
FROM python:2.7

ENV VERSION=0.1.30

RUN \
      curl -fsSL "https://github.com/Yelp/elastalert/archive/v${VERSION}.tar.gz" \
      -o elastalert.tar.gz \
      && tar xvf elastalert.tar.gz \
      && rm elastalert.tar.gz \
      && mv elastalert-${VERSION} /opt/elastalert

WORKDIR /opt/elastalert

RUN pip install -r requirements-dev.txt

RUN python setup.py install

COPY --chown=root:root entrypoint.sh /opt
RUN chmod 777 /opt/entrypoint.sh

COPY config.yaml .

CMD ["/opt/entrypoint.sh"]
