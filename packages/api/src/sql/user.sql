-- name: GetUserById :one
select *
from users
where id = sqlc.arg('userId');

-- name: GetUserByUserName :one
select *
from users
where user_name = sqlc.arg('userName');

-- name: CreateUser :one
insert into users (
  user_name,
  password_hash
) values (
  sqlc.arg('userName'),
  sqlc.arg('passwordHash')
)
returning id;

-- name: UpdateUser :exec
update users
set
  password_hash = coalesce(sqlc.narg('passwordHash'), password_hash),
  public = coalesce(sqlc.narg('public')::boolean, public)
where id = sqlc.arg('userId');
