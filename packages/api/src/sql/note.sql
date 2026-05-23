-- name: ListNotes :many
select
  n.id,
  n.content,
  n.created_at
from note n
inner join record r on r.id = n.record_id
where n.user_id = sqlc.arg('userId')
and r.user_id = sqlc.arg('userId')
and n.record_id = sqlc.arg('recordId')
order by n.created_at desc;

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
