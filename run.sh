#!/bin/sh

# im not sure why im doing this as it probably wont ever work, but i just want to have some fun

a="x64"
dir=`pwd`
update=0
name="$(basename "$(test -L "$0" && readlink "$0" || echo "$0")")"

while getopts a:d:u: flag
do
    case "${flag}" in
        a) a=${OPTARG};;
        d) dir=${OPTARG};;
        u) update=1;;
    esac
done

cd $dir
if [[ $? -ne "0" ]]; then
  exit 9
fi

node -v
if [[ $? -ne "0" ]]; then
  echo "node not installed, installing..."

  if [[ $OS != "Windows_NT" ]]; then
    echo "fatal error: no implementation found for OS: $OS"
    read -p "press any key to exit..."
    exit 1
  fi

  if [[ $a != "x64" && $a != "x82" && $a != "arm64" ]]; then
    echo "fatal error: invalid argment -a ($a)"
    read -p "press any key to exit..."
    exit 2
  fi

  # this is nice
  msiexec -i https://nodejs.org/dist/v20.12.2/node-v20.12.2-${a}.msi -passive -qn

  node -v
  if [[ $? -ne "0" ]]; then
    echo "fatal error: failed to install node.js"
    echo "try again with administrator privilege or install it manualy: https://nodejs.org/en/download"
    read -p "press any key to exit..."
    exit 3
  fi
fi

echo "git: `git --version`"
if [[ $? -ne "0" ]]; then
  echo "git not installed, installing..."
  if [[ $OS != "Windows_NT" ]]; then
    echo "fatal error: no implementation found for OS: $OS"
    read -p "press any key to exit..."
    exit 4
  fi

  winget install --id Git.Git -e --source winget

  git --version
  if [[ $? -ne "0" ]]; then
    echo "fatal error: failed to install git"
    echo "try again with administrator privilege or install it manualy: https://git-scm.com/downloads"
    read -p "press any key to exit..."
    exit 5
  fi
fi

git branch
if [[ $? -ne "0" ]]; then
  if [[ "${dir}/${name}" -ef $0 ]]; then
    cp $0 ${TMP}/${name}
    ${TMP}/${name} $@
    exit 0
  fi
  mv "${dir}/${name}" "${dir}/${name}"
  if [[ $? == "0" ]]; then
    rm "${dir}/${name}"
  fi

  echo "source files not found, cloning..."
  git clone https://github.com/Maiku19/advrngmntr.git $dir --branch=latest-stable
  if [[ $? -ne "0" ]]; then
    echo "fatal error: failed to clone repo"
    echo "try again with administrator privilege or clone it manualy: https://github.com/Maiku19/advrngmntr"
    read -p "press any key to exit..."
    exit 6
  fi

  npm i
  exec "$dir/run.sh @$"
  exit 0
elif [[ $update == 1 ]]; then
  if [[ "${dir}/${name}" -ef $0 ]]; then
    cp $0 ${TMP}/${name}
    ${TMP}/${name} $@
    exit 0
  else
  git reset --hard
  git pull
  fi
else
  git fetch
  echo "if you want to update run: './run.sh -u' or 'git pull'"
fi

# shold be installed on `npm i` but imma leave it just incase
tsc -v
if [[ $? != "0" ]]; then
  npm install typescript

  tsc -v
  if [[ $? != "0" ]]; then 
    echo "fatal error: failed to install typescript"
    echo "try again with administrator privilege or install it manualy: https://www.typescriptlang.org/download/"
    read -p "press any key to exit..."
    exit 7
  fi
fi

# check if exists
mv ./.env ./.env
if [[ $? -ne "0" ]]; then
  echo "press crtl-c once if you already have your refresh token"
  node ./node_modules/ring-client-api/lib/ring-auth-cli.js

  read -p "RING_REFRESH_TOKEN="
  echo "RING_REFRESH_TOKEN=$REPLY" > ./.env

  mv ./.env ./.env
  if [[ $? -ne "0" ]]; then
    echo "fatal error: failed to get refresh token"
    echo "try again with administrator privilege or place it manualy in: (echo \"RING_REFRESH_TOKEN=<put_your_token_here>\" > ./.env)"
    read -p "press any key to exit..."
    exit 8
  fi
fi

npm start