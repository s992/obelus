-- name: CreateGoodreadsImport :one
insert into goodreads_import (
  job_id,
  user_id
) values (
  sqlc.arg('jobId'),
  sqlc.arg('userId')
) returning id;

-- name: CreateGoodreadsImportFailure :exec
insert into goodreads_import_failure (
  import_id,
  title,
  author
) values (
  sqlc.arg('importId'),
  sqlc.arg('title'),
  sqlc.arg('author')
);

-- name: GetGoodreadsImportIdByJobId :one
select id
from goodreads_import
where job_id = sqlc.arg('jobId');

-- name: FinishGoodreadsImport :exec
update goodreads_import
set
  completed_at = NOW(),
  success_count = sqlc.arg('successCount')::integer
where job_id = sqlc.arg('jobId');

-- name: ListGoodreadsImports :many
select
  gi.*,
  coalesce(json_agg(gif) filter (where gif.id is not null), '[]') as failures
from goodreads_import gi
left join goodreads_import_failure gif on gif.import_id = gi.id
where gi.user_id = sqlc.arg('userId')
group by gi.id
order by gi.created_at desc;
