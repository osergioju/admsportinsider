-- public.common_terms definition

-- Drop table

-- DROP TABLE public.common_terms;

CREATE TABLE public.common_terms (
	id serial4 NOT NULL,
	code varchar(100) NOT NULL,
	name_pt varchar(255) NOT NULL,
	category varchar(100) NOT NULL DEFAULT 'Geral'::character varying,
	CONSTRAINT common_terms_code_key UNIQUE (code),
	CONSTRAINT common_terms_pkey PRIMARY KEY (id)
);


-- public.common_term_translations definition

-- Drop table

-- DROP TABLE public.common_term_translations;

CREATE TABLE public.common_term_translations (
	id serial4 NOT NULL,
	common_term_id int4 NOT NULL,
	locale varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT common_term_translations_common_term_id_locale_key UNIQUE (common_term_id, locale),
	CONSTRAINT common_term_translations_pkey PRIMARY KEY (id),
	CONSTRAINT common_term_translations_common_term_id_fkey FOREIGN KEY (common_term_id) REFERENCES public.common_terms(id) ON DELETE CASCADE
);