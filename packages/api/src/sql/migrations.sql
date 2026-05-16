-- name: ListMigrations :many
select *
from migration;

-- name: CreateMigration :exec
insert into migration (
  name,
  applied_at
) values (
  sqlc.arg('name'),
  now()
);
