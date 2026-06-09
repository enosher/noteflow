-- NoteFlow seed data (temporary)
-- auth.uid() does not work in SQL editor so my user UUID is hardcoded below.

-- Module 1: CS2030 with topics and subtopics
with m as (
  insert into modules (user_id, code, name, description)
  values (
    '9f053e47-78b2-4719-a235-1974022c15b3',
    'CS2030',
    'Programming Methodology II',
    'OOP in Java, functional programming'
  )
  returning id
), t1 as (
  insert into topics (module_id, name, description, order_index)
  select id, 'Inheritance', 'Class hierarchies and method overriding', 0 from m
  returning id, module_id
), t2 as (
  insert into topics (module_id, name, description, order_index)
  select module_id, 'Polymorphism', 'Dynamic dispatch and abstract types', 1 from t1
  returning id
)
insert into subtopics (topic_id, name, order_index)
select id, 'Method Overriding', 0 from t1
union all
select id, 'Abstract Classes', 1 from t1;

-- Module 2: MA1521 (no topics/subtopics — keeps the list view non-trivial)
insert into modules (user_id, code, name, description)
values (
  '9f053e47-78b2-4719-a235-1974022c15b3',
  'MA1521',
  'Calculus for Computing',
  'Limits, derivatives, integrals'
);