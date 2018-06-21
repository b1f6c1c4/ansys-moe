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
FROM ansys-commond as built

FROM python:3.6-jessie

RUN pip install numpy scipy json-tricks

RUN \
        mkdir -p /opt \
        && cd /opt \
        && git clone --depth=1 https://github.com/sahilm89/lhsmdu \
        && cd lhsmdu \
        && python setup.py install

WORKDIR /root/
COPY --from=built /go/bin/commond-std .
COPY . ./Python
ENV PYTHONPATH=/root/Python
CMD ["./commond-std"]
