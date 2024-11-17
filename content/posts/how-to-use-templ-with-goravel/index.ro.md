+++
date = '2024-11-18T00:17:52+02:00'
slug = 'cum-sa-folosesti-templ-in-goravel'
title = 'Cum să folosești Templ în Goravel'
description = 'Cum să folosești Templ în framework-ul Goravel'
featured_image = 'templ-with-goravel.png'
etichete = ['go', 'goravel', 'templ']
categorii = 'Tutoriale'
+++


## Instaleaza framework-ul si pluginuri

Primul pas este să instalăm [Goravel](https://goravel.dev/). Este un framework complet cu foarte multe funcții scris în Go pentru programatorii familiari cu framework-ul Laravel.

Pașii din documentația [Getting started](https://github.com/goravel/docs/blob/master/getting-started/installation.md):
```bash
// Descarcă framework-ul
git clone https://github.com/goravel/goravel.git
rm -rf goravel/.git*

// Instalează dependențele
cd goravel
go mod tidy

// Crează fișierul .env
cp .env.example .env

// Generează cheia aplicației
go run . artisan key:generate
```

Acum instalează [templ](https://templ.guide/quick-start/installation) pentru randare html și [air](https://github.com/cosmtrek/air?tab=readme-ov-file#installation) pentru hot reloading:
```bash
go install github.com/a-h/templ/cmd/templ@latest
go install github.com/cosmtrek/air@latest
```

## Configurare structură front-end
(încă în lucru - voi actualiza tutorialul cu variabile globale și script push)

&bull; În fișierul `/.gitignore` adaugă această linie: `*_templ.go`

&bull; Șterge fișierul `resources/views/welcome.tmpl`

&bull; Creează 2 foldere în `resources/views/` cu numele `home` și `parts`

&bull; În folderul `resources/views/parts/` creează 3 fișiere:

&nbsp;&nbsp; 1. `resources/views/parts/header.templ`
```go
package parts

templ Header() {
	<h1>Header</h1>
}
```
&nbsp;&nbsp; 2. `resources/views/parts/footer.templ`
```go
package parts

templ Footer() {
	<footer>
		<p>&copy; 2024 MyProject</p>
	</footer>
}
```
&nbsp;&nbsp; 3. `resources/views/parts/template.templ`
```go
package parts

templ Template() {
	<!DOCTYPE html>
	<html>
		<head>
			<title>My Page</title>
			<meta charset="utf-8"/>
			<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
			<meta name="viewport" content="width=device-width, initial-scale=1"/>
			<!-- Your styles go here -->
		</head>
		<body>
			@Header()
			{ children... }
			@Footer()
			<!-- Your scripts go here -->
			<script src="//unpkg.com/alpinejs" defer></script>
		</body>
	</html>
}
```
&bull; Creează componenta de pagină principală: `resources/views/home/index.templ`
```go
package home

import "goravel/resources/views/parts"

templ Index() {
	@parts.Template() {
		<h1>Homepage</h1>
		<div>Templ is awesome</div>
	}
}
```
Documentația templ pentru [componente copii este aici](https://templ.guide/syntax-and-usage/template-composition). Există un exemplu pentru o structură layout dar mie îmi place mai mult metoda cu componentă copil.

## Folosește componenta pagina principală în controller
Am facut un fișier `app/http/controllers/controller.go` unde pot salva cateva funcții ajutătoare care vor fii accesibile din orice controller.
```go
package controllers

import (
	"github.com/a-h/templ"
	"github.com/goravel/framework/contracts/http"
)

func RenderTempl(c http.Context, comp templ.Component) http.Response {
	c.Response().Status(200)
	c.Response().Header("Content-Type", "text/html")
	comp.Render(c, c.Response().Writer())
	return nil
}
```
Funcția asta randează componenta templ în response buffer cu status http 200 Ok.
Acum putem folosii funcția în `app/http/controllers/home_controller.go`
```go
package controllers

import (
	"goravel/resources/views/home"
	"github.com/goravel/framework/contracts/http"
)

type HomeController struct {
	//Dependent services
}

func NewHomeController() *HomeController {
	return &HomeController{
		//Inject services
	}
}

func (r *HomeController) Index(ctx http.Context) http.Response {
	// doing awesome stuff here
	return RenderTempl(ctx, home.Index())
}
```
Acum adaugăm o nouă rută:
```go
package routes

import (
	"goravel/app/http/controllers"
	"github.com/goravel/framework/facades"
)

func Web() {
	homeController := controllers.NewHomeController()
	facades.Route().Get("/", homeController.Index)
}
```

## Configurare hot reloading folosind Air

Goravel are deja configurația pentru Air în fișierul `.air.toml`, trebuie doar să adăugăm comanda `templ generate` în parametrul cmd, ca în exemplu:
```diff
[build]
  bin = "./storage/temp/main"
-  cmd = "go build -o ./storage/temp/main ."
+  cmd = "templ generate && go build -o ./storage/temp/main ."
```
Dacă lucrezi pe Windows adaugă `.exe` dupa cuvantul `main` și pentru parametrul `bin` și `cmd`:
```toml
[build]
  bin = "./storage/temp/main.exe"
  cmd = "templ generate && go build -o ./storage/temp/main.exe ."
```
Gata ! Happy coding !
