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
  completed_at = NOW()
where id = sqlc.arg('id');
