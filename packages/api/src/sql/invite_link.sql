-- name: CreateInviteLink :exec
insert into invite_link (
  token,
  expires_at,
  created_by
) values (
  sqlc.arg('token'),
  sqlc.arg('expiresAt'),
  sqlc.arg('createdBy')
);

-- name: GetInviteLink :one
select *
from invite_link
where token = sqlc.arg('token');

-- name: ListInviteLinks :many
with filtered_links as (
  select *
  from invite_link
  where sqlc.narg('status')::text is null
  or case
    when used_by is not null then 'used'
    when used_at is not null and used_by is null then 'invalidated'
    else 'active'
  end = sqlc.narg('status')::text
),
total as (
  select count(*) as total_count
  from filtered_links
)
select
  fl.id,
  fl.token,
  fl.expires_at,
  fl.used_at,
  fl.used_by,
  u.user_name,
  t.total_count
from filtered_links fl
cross join total t
left join users u on u.id = fl.used_by
where (
  sqlc.narg('cursor')::timestamptz is null
  or expires_at < sqlc.narg('cursor')::timestamptz
)
order by expires_at desc
limit sqlc.arg('pageSize')::integer;

-- name: UseInviteLink :exec
update invite_link
set
  used_at = now(),
  used_by = sqlc.arg('userId')
where token = sqlc.arg('token');

-- name: InvalidateInviteLink :exec
update invite_link
set
  used_at = now(),
  used_by = null
where id = sqlc.arg('id')
and used_by is null;
