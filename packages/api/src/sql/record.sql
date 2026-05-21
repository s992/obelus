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
  and (
    sqlc.narg('status')::record_status is null
    or r.status = sqlc.narg('status')
  )
  and (
    sqlc.narg('judgment')::judgment is null
    or r.judgment = sqlc.narg('judgment')
  )
  group by r.id
),
filtered as (
  select
    *,
    count(*) over () as total_count
  from records_with_notes
)
select
  id,
  book_id,
  finished_at,
  started_at,
  last_activity as updated_at,
  judgment,
  status,
  created_at,
  total_count
from filtered
where (
  sqlc.narg('cursor')::timestamp is null
  or (
    case sqlc.arg('sortField')::text
      when 'started_at' then started_at
      when 'finished_at' then finished_at
      else last_activity
    end
  ) < sqlc.arg('cursor')::timestamp
  or (
    sqlc.arg('sortField')::text in ('started_at', 'finished_at')
    and case sqlc.arg('sortField')::text
      when 'started_at' then started_at is null
      when 'finished_at' then finished_at is null
    end
  )
)
order by
  case when sqlc.arg('sortField')::text = 'started_at' then started_at
       when sqlc.arg('sortField')::text = 'finished_at' then finished_at
  end desc nulls last,
  last_activity desc
limit sqlc.arg('pageSize')::integer;

-- name: CreateRecord :exec
insert into record (
  book_id,
  user_id,
  status,
  started_at,
  finished_at,
  judgment
) values (
  sqlc.arg('bookId')::integer,
  sqlc.arg('userId'),
  sqlc.arg('status'),
  sqlc.arg('startedAt'),
  sqlc.arg('finishedAt'),
  sqlc.narg('judgment')
);

-- name: UpdateRecord :exec
update record
set
  finished_at = coalesce(sqlc.narg('finishedAt')::timestamp, finished_at),
  started_at = coalesce(sqlc.narg('startedAt')::timestamp, started_at),
  judgment = sqlc.narg('judgment')::judgment,
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

-- name: DeleteRecord :exec
delete
from record
where id = sqlc.arg('id')
and user_id = sqlc.arg('userId');
