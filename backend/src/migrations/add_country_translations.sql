-- Tabela de traduções de nomes de países por locale
CREATE TABLE IF NOT EXISTS country_translations (
  id         SERIAL PRIMARY KEY,
  id_country INTEGER      NOT NULL REFERENCES countries(id_country) ON DELETE CASCADE,
  locale     VARCHAR(10)  NOT NULL,
  name       VARCHAR(150) NOT NULL,
  UNIQUE (id_country, locale)
);

-- Traduções para en-US e ES
-- Fonte: lista de países ativos em 2026-05-09
-- Idempotente: ON CONFLICT DO UPDATE

INSERT INTO country_translations (id_country, locale, name) VALUES
-- Albânia (281)
(281, 'en-US', 'Albania'),
(281, 'ES', 'Albania'),
-- Alemanha (272)
(272, 'en-US', 'Germany'),
(272, 'ES', 'Alemania'),
-- Algeria (265)
(265, 'en-US', 'Algeria'),
(265, 'ES', 'Argelia'),
-- Andorra (341)
(341, 'en-US', 'Andorra'),
(341, 'ES', 'Andorra'),
-- Angola (246)
(246, 'en-US', 'Angola'),
(246, 'ES', 'Angola'),
-- Antígua e Barbuda (357)
(357, 'en-US', 'Antigua and Barbuda'),
(357, 'ES', 'Antigua y Barbuda'),
-- Arábia Saudita (268)
(268, 'en-US', 'Saudi Arabia'),
(268, 'ES', 'Arabia Saudita'),
-- Argentina (242)
(242, 'en-US', 'Argentina'),
(242, 'ES', 'Argentina'),
-- Arménia (351)
(351, 'en-US', 'Armenia'),
(351, 'ES', 'Armenia'),
-- Aruba (352)
(352, 'en-US', 'Aruba'),
(352, 'ES', 'Aruba'),
-- Austrália (282)
(282, 'en-US', 'Australia'),
(282, 'ES', 'Australia'),
-- Áustria (274)
(274, 'en-US', 'Austria'),
(274, 'ES', 'Austria'),
-- Azerbeijão (362)
(362, 'en-US', 'Azerbaijan'),
(362, 'ES', 'Azerbaiyán'),
-- Belgium (247)
(247, 'en-US', 'Belgium'),
(247, 'ES', 'Bélgica'),
-- Benin (333)
(333, 'en-US', 'Benin'),
(333, 'ES', 'Benín'),
-- Bielorússia (363)
(363, 'en-US', 'Belarus'),
(363, 'ES', 'Bielorrusia'),
-- Bolívia (241)
(241, 'en-US', 'Bolivia'),
(241, 'ES', 'Bolivia'),
-- Bósnia e Herzegovina (285)
(285, 'en-US', 'Bosnia and Herzegovina'),
(285, 'ES', 'Bosnia y Herzegovina'),
-- Brasil (240)
(240, 'en-US', 'Brazil'),
(240, 'ES', 'Brasil'),
-- Bulgaria (259)
(259, 'en-US', 'Bulgaria'),
(259, 'ES', 'Bulgaria'),
-- Burkina Faso (286)
(286, 'en-US', 'Burkina Faso'),
(286, 'ES', 'Burkina Faso'),
-- Cabo Verde (313)
(313, 'en-US', 'Cape Verde'),
(313, 'ES', 'Cabo Verde'),
-- Camarões (277)
(277, 'en-US', 'Cameroon'),
(277, 'ES', 'Camerún'),
-- Canadá (312)
(312, 'en-US', 'Canada'),
(312, 'ES', 'Canadá'),
-- Cazaquistão (369)
(369, 'en-US', 'Kazakhstan'),
(369, 'ES', 'Kazajistán'),
-- Chile (239)
(239, 'en-US', 'Chile'),
(239, 'ES', 'Chile'),
-- China (269)
(269, 'en-US', 'China'),
(269, 'ES', 'China'),
-- Chipre (342)
(342, 'en-US', 'Cyprus'),
(342, 'ES', 'Chipre'),
-- Colômbia (238)
(238, 'en-US', 'Colombia'),
(238, 'ES', 'Colombia'),
-- Congo (364)
(364, 'en-US', 'Congo'),
(364, 'ES', 'Congo'),
-- Coreia do Sul (273)
(273, 'en-US', 'South Korea'),
(273, 'ES', 'Corea del Sur'),
-- Costa do Marfim (276)
(276, 'en-US', 'Ivory Coast'),
(276, 'ES', 'Costa de Marfil'),
-- Costa Rica (258)
(258, 'en-US', 'Costa Rica'),
(258, 'ES', 'Costa Rica'),
-- Croácia (288)
(288, 'en-US', 'Croatia'),
(288, 'ES', 'Croacia'),
-- Czech Republic (289)
(289, 'en-US', 'Czech Republic'),
(289, 'ES', 'República Checa'),
-- Denmark (249)
(249, 'en-US', 'Denmark'),
(249, 'ES', 'Dinamarca'),
-- DR Congo (248)
(248, 'en-US', 'DR Congo'),
(248, 'ES', 'Rep. Dem. del Congo'),
-- Egito (290)
(290, 'en-US', 'Egypt'),
(290, 'ES', 'Egipto'),
-- El Salvador (359)
(359, 'en-US', 'El Salvador'),
(359, 'ES', 'El Salvador'),
-- Equador (237)
(237, 'en-US', 'Ecuador'),
(237, 'ES', 'Ecuador'),
-- Eritreia (365)
(365, 'en-US', 'Eritrea'),
(365, 'ES', 'Eritrea'),
-- Escócia (275)
(275, 'en-US', 'Scotland'),
(275, 'ES', 'Escocia'),
-- Eslováquia (304)
(304, 'en-US', 'Slovakia'),
(304, 'ES', 'Eslovaquia'),
-- Eslovénia (339)
(339, 'en-US', 'Slovenia'),
(339, 'ES', 'Eslovenia'),
-- Estados Unidos (244)
(244, 'en-US', 'United States'),
(244, 'ES', 'Estados Unidos'),
-- Estónia (334)
(334, 'en-US', 'Estonia'),
(334, 'ES', 'Estonia'),
-- Finland (266)
(266, 'en-US', 'Finland'),
(266, 'ES', 'Finlandia'),
-- France (250)
(250, 'en-US', 'France'),
(250, 'ES', 'Francia'),
-- Gabão (291)
(291, 'en-US', 'Gabon'),
(291, 'ES', 'Gabón'),
-- Gâmbia (292)
(292, 'en-US', 'Gambia'),
(292, 'ES', 'Gambia'),
-- Gana (278)
(278, 'en-US', 'Ghana'),
(278, 'ES', 'Ghana'),
-- Geórgia (336)
(336, 'en-US', 'Georgia'),
(336, 'ES', 'Georgia'),
-- Gibraltar (367)
(367, 'en-US', 'Gibraltar'),
(367, 'ES', 'Gibraltar'),
-- Greece (264)
(264, 'en-US', 'Greece'),
(264, 'ES', 'Grecia'),
-- Guatemala (262)
(262, 'en-US', 'Guatemala'),
(262, 'ES', 'Guatemala'),
-- Guiné (315)
(315, 'en-US', 'Guinea'),
(315, 'ES', 'Guinea'),
-- Guiné-Bissau (326)
(326, 'en-US', 'Guinea-Bissau'),
(326, 'ES', 'Guinea-Bisáu'),
-- Guiné Equatorial (344)
(344, 'en-US', 'Equatorial Guinea'),
(344, 'ES', 'Guinea Ecuatorial'),
-- Haiti (349)
(349, 'en-US', 'Haiti'),
(349, 'ES', 'Haití'),
-- Honduras (327)
(327, 'en-US', 'Honduras'),
(327, 'ES', 'Honduras'),
-- Hungria (293)
(293, 'en-US', 'Hungary'),
(293, 'ES', 'Hungría'),
-- Iémen (325)
(325, 'en-US', 'Yemen'),
(325, 'ES', 'Yemen'),
-- ilha da Curação (314)
(314, 'en-US', 'Curaçao'),
(314, 'ES', 'Curazao'),
-- Ilhas Cook (358)
(358, 'en-US', 'Cook Islands'),
(358, 'ES', 'Islas Cook'),
-- Ilhas Faroé (366)
(366, 'en-US', 'Faroe Islands'),
(366, 'ES', 'Islas Feroe'),
-- Inglaterra (257)
(257, 'en-US', 'England'),
(257, 'ES', 'Inglaterra'),
-- Irão (368)
(368, 'en-US', 'Iran'),
(368, 'ES', 'Irán'),
-- Iraque (317)
(317, 'en-US', 'Iraq'),
(317, 'ES', 'Irak'),
-- Irlanda do Norte (260)
(260, 'en-US', 'Northern Ireland'),
(260, 'ES', 'Irlanda del Norte'),
-- Islândia (316)
(316, 'en-US', 'Iceland'),
(316, 'ES', 'Islandia'),
-- Israel (337)
(337, 'en-US', 'Israel'),
(337, 'ES', 'Israel'),
-- Italy (251)
(251, 'en-US', 'Italy'),
(251, 'ES', 'Italia'),
-- Jamaica (294)
(294, 'en-US', 'Jamaica'),
(294, 'ES', 'Jamaica'),
-- Japan (267)
(267, 'en-US', 'Japan'),
(267, 'ES', 'Japón'),
-- Jordânia (318)
(318, 'en-US', 'Jordan'),
(318, 'ES', 'Jordania'),
-- Kosovo (345)
(345, 'en-US', 'Kosovo'),
(345, 'ES', 'Kosovo'),
-- Letónia (370)
(370, 'en-US', 'Latvia'),
(370, 'ES', 'Letonia'),
-- Libéria (319)
(319, 'en-US', 'Liberia'),
(319, 'ES', 'Liberia'),
-- Líbia (371)
(371, 'en-US', 'Libya'),
(371, 'ES', 'Libia'),
-- Lituânia (329)
(329, 'en-US', 'Lithuania'),
(329, 'ES', 'Lituania'),
-- Luxemburgo (338)
(338, 'en-US', 'Luxembourg'),
(338, 'ES', 'Luxemburgo'),
-- Macedonia do Norte (335)
(335, 'en-US', 'North Macedonia'),
(335, 'ES', 'Macedonia del Norte'),
-- Malawi (320)
(320, 'en-US', 'Malawi'),
(320, 'ES', 'Malaui'),
-- Mali (295)
(295, 'en-US', 'Mali'),
(295, 'ES', 'Malí'),
-- Malta (372)
(372, 'en-US', 'Malta'),
(372, 'ES', 'Malta'),
-- Marrocos (297)
(297, 'en-US', 'Morocco'),
(297, 'ES', 'Marruecos'),
-- Martinica (353)
(353, 'en-US', 'Martinique'),
(353, 'ES', 'Martinica'),
-- Mexico (263) — entrada sem vínculos, desativada
(263, 'en-US', 'Mexico'),
(263, 'ES', 'México'),
-- México (245) — entrada ativa com 37 clubes e 3 ligas
(245, 'en-US', 'Mexico'),
(245, 'ES', 'México'),
-- Moçambique (346)
(346, 'en-US', 'Mozambique'),
(346, 'ES', 'Mozambique'),
-- Moldávia (330)
(330, 'en-US', 'Moldova'),
(330, 'ES', 'Moldavia'),
-- Montenegro (296)
(296, 'en-US', 'Montenegro'),
(296, 'ES', 'Montenegro'),
-- Namíbia (354)
(354, 'en-US', 'Namibia'),
(354, 'ES', 'Namibia'),
-- Netherlands (252)
(252, 'en-US', 'Netherlands'),
(252, 'ES', 'Países Bajos'),
-- Nigeria (253)
(253, 'en-US', 'Nigeria'),
(253, 'ES', 'Nigeria'),
-- Noruega (299)
(299, 'en-US', 'Norway'),
(299, 'ES', 'Noruega'),
-- Nova Zelândia (298)
(298, 'en-US', 'New Zealand'),
(298, 'ES', 'Nueva Zelanda'),
-- Panama (254)
(254, 'en-US', 'Panama'),
(254, 'ES', 'Panamá'),
-- Paraguai (236)
(236, 'en-US', 'Paraguay'),
(236, 'ES', 'Paraguay'),
-- Perú (233)
(233, 'en-US', 'Peru'),
(233, 'ES', 'Perú'),
-- Polónia (300)
(300, 'en-US', 'Poland'),
(300, 'ES', 'Polonia'),
-- Porto Rico (347)
(347, 'en-US', 'Puerto Rico'),
(347, 'ES', 'Puerto Rico'),
-- Portugal (255)
(255, 'en-US', 'Portugal'),
(255, 'ES', 'Portugal'),
-- Quénia (328)
(328, 'en-US', 'Kenya'),
(328, 'ES', 'Kenia'),
-- República Dominicana (343)
(343, 'en-US', 'Dominican Republic'),
(343, 'ES', 'República Dominicana'),
-- Republic of Ireland (301)
(301, 'en-US', 'Republic of Ireland'),
(301, 'ES', 'República de Irlanda'),
-- Roménia (302)
(302, 'en-US', 'Romania'),
(302, 'ES', 'Rumania'),
-- Russia (215)
(215, 'en-US', 'Russia'),
(215, 'ES', 'Rusia'),
-- San Marino (373)
(373, 'en-US', 'San Marino'),
(373, 'ES', 'San Marino'),
-- São Martinho (321)
(321, 'en-US', 'Saint Martin'),
(321, 'ES', 'San Martín'),
-- Senegal (279)
(279, 'en-US', 'Senegal'),
(279, 'ES', 'Senegal'),
-- Serra Leoa (322)
(322, 'en-US', 'Sierra Leone'),
(322, 'ES', 'Sierra Leona'),
-- Sérvia (303)
(303, 'en-US', 'Serbia'),
(303, 'ES', 'Serbia'),
-- Síria (323)
(323, 'en-US', 'Syria'),
(323, 'ES', 'Siria'),
-- South Africa (350)
(350, 'en-US', 'South Africa'),
(350, 'ES', 'Sudáfrica'),
-- Spain (256)
(256, 'en-US', 'Spain'),
(256, 'ES', 'España'),
-- Suécia (305)
(305, 'en-US', 'Sweden'),
(305, 'ES', 'Suecia'),
-- Suíça (270)
(270, 'en-US', 'Switzerland'),
(270, 'ES', 'Suiza'),
-- Suriname (348)
(348, 'en-US', 'Suriname'),
(348, 'ES', 'Surinam'),
-- Tailândia (374)
(374, 'en-US', 'Thailand'),
(374, 'ES', 'Tailandia'),
-- Tanzânia (355)
(355, 'en-US', 'Tanzania'),
(355, 'ES', 'Tanzania'),
-- Timor-Leste (280)
(280, 'en-US', 'Timor-Leste'),
(280, 'ES', 'Timor Oriental'),
-- Togo (340)
(340, 'en-US', 'Togo'),
(340, 'ES', 'Togo'),
-- Trinidade e Tobago (360)
(360, 'en-US', 'Trinidad and Tobago'),
(360, 'ES', 'Trinidad y Tobago'),
-- Tunísia (324)
(324, 'en-US', 'Tunisia'),
(324, 'ES', 'Túnez'),
-- Turkey (306) — entrada sem vínculos, desativada
(306, 'en-US', 'Turkey'),
(306, 'ES', 'Turquía'),
-- Turquia (271) — entrada ativa com 55 clubes e 3 ligas
(271, 'en-US', 'Turkey'),
(271, 'ES', 'Turquía'),
-- Ucrânia (307)
(307, 'en-US', 'Ukraine'),
(307, 'ES', 'Ucrania'),
-- Uganda (331)
(331, 'en-US', 'Uganda'),
(331, 'ES', 'Uganda'),
-- United Arab Emirates (356)
(356, 'en-US', 'United Arab Emirates'),
(356, 'ES', 'Emiratos Árabes Unidos'),
-- Uruguai (235)
(235, 'en-US', 'Uruguay'),
(235, 'ES', 'Uruguay'),
-- Uzbequistão (308)
(308, 'en-US', 'Uzbekistan'),
(308, 'ES', 'Uzbekistán'),
-- Venezuela (234)
(234, 'en-US', 'Venezuela'),
(234, 'ES', 'Venezuela'),
-- Wales (311)
(311, 'en-US', 'Wales'),
(311, 'ES', 'Gales'),
-- Zâmbia (309)
(309, 'en-US', 'Zambia'),
(309, 'ES', 'Zambia'),
-- Zimbabwe (310)
(310, 'en-US', 'Zimbabwe'),
(310, 'ES', 'Zimbabue')
ON CONFLICT (id_country, locale) DO UPDATE SET name = EXCLUDED.name;
