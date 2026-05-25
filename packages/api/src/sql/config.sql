-- name: GetConfig :one
select *
from config;

-- name: UpdateConfig :exec
update config
set
  registration_strategy = coalesce(sqlc.narg('registrationStrategy'), registration_strategy),
  updated_by = sqlc.arg('userId');
