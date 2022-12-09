
npm run build

ssh -t root@192.241.254.136 -f 'rm -r /var/www/html/wikibaby-admin/*; bash -l'

scp -r build/* root@192.241.254.136:/var/www/html/wikibaby-admin/

cp .env.backup .env
rm .env.backup
