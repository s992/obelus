-- name: ListNotes :many
select
  id,
  content,
  created_at
from note
where user_id = sqlc.arg('userId')
and record_id = sqlc.arg('recordId')
order by created_at desc;

-- name: CreateNote :exec
insert into note (
  record_id,
  content,
  user_id
) values (
  sqlc.arg('recordId'),
  sqlc.arg('content'),
  sqlc.arg('userId')
);
