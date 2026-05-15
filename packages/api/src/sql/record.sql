-- name: ListRecords :many
with records_with_notes as (
  select
    r.*,
    coalesce(
      json_agg(n.* order by n.created_at desc)
      filter (where n.id is not null),
      '[]'
    ) as notes,
    greatest(r.updated_at, coalesce(max(n.created_at), r.updated_at)) as last_activity
  from record r
  left join note n on n.record_id = r.id
  where r.user_id = sqlc.arg('userId')
  and r.status = sqlc.arg('status')
  group by r.id
)
select
  id,
  book_id,
  finished_at,
  started_at,
  last_activity as updated_at,
  judgment,
  status,
  created_at
from records_with_notes
where (
  sqlc.narg('cursor')::timestamp is null
  or last_activity < sqlc.arg('cursor')::timestamp
)
order by last_activity desc
limit sqlc.arg('pageSize')::integer;

-- name: CreateRecord :exec
insert into record (
  book_id,
  user_id,
  status,
  started_at,
  finished_at
) values (
  sqlc.arg('bookId')::integer,
  sqlc.arg('userId'),
  sqlc.arg('status'),
  sqlc.arg('startedAt'),
  sqlc.arg('finishedAt')
);

-- name: UpdateRecord :exec
update record
set
  finished_at = coalesce(sqlc.narg('finishedAt')::timestamp, finished_at),
  started_at = coalesce(sqlc.narg('startedAt')::timestamp, started_at),
  judgment = coalesce(sqlc.narg('judgment')::judgment, judgment),
  status = coalesce(sqlc.narg('status')::record_status, status)
where id = sqlc.arg('id')
and user_id = sqlc.arg('userId');

-- name: GetRecordByBookId :one
select *
from record
where book_id = sqlc.arg('bookId')::integer
and user_id = sqlc.arg('userId');

-- name: ListRecordsByBookIds :many
select *
from record
where book_id = any(sqlc.arg('bookIds')::integer[])
and user_id = sqlc.arg('userId');
