-- name: CreateInviteLink :exec
insert into invite_link (
  token,
  expires_at
) values (
  sqlc.arg('token'),
  sqlc.arg('expiresAt')
);

-- name: GetInviteLink :one
select *
from invite_link
where token = sqlc.arg('token');

-- name: ListInviteLinks :many
select *
from invite_link;

-- name: UseInviteLink :exec
update invite_link
set
  used_at = now(),
  used_by = sqlc.arg('userId')
where token = sqlc.arg('token');
