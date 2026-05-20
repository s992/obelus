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

-- name: GetUserPublicProfile :one
select
  u.id,
  u.user_name,
  u.public,
  count(r.id) as total_records,
  count(
    case when r.finished_at >= date_trunc('year', current_date) then 1 end
  ) as finished_this_year,
  count(case when r.status = 'reading' then 1 end) as reading_count,
  count(case when r.status = 'finished' then 1 end) as finished_count,
  count(case when r.status = 'planned' then 1 end) as planned_count,
  least(
    coalesce(min(r.created_at), 'infinity'),
    coalesce(min(r.started_at), 'infinity'),
    coalesce(min(r.finished_at), 'infinity')
  ) as oldest_record,
  max(r.updated_at) as last_updated
from users u
left join record r on r.user_id = u.id
where u.user_name = sqlc.arg('userName')
group by u.id, u.user_name, u.public;
