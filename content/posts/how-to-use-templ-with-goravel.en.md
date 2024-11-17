+++
date = '2024-11-18T00:17:52+02:00'
title = 'How to Use Templ With Goravel'
description = "How to use Templ with Goravel go framework"
featured_image = "/images/templ-with-goravel.png"
tags = ["go", "goravel", "templ"]
categories = "Tutorials"
+++


## Install the framework and tools

First let's install [Goravel](https://goravel.dev/). It's a batteries included Go Web Framework for developers familiar with the Laravel Framework.

Steps from [Getting started documentation](https://github.com/goravel/docs/blob/master/getting-started/installation.md):
```bash
// Download framework
git clone https://github.com/goravel/goravel.git
rm -rf goravel/.git*

// Install dependencies
cd goravel
go mod tidy

// Create .env environment configuration file
cp .env.example .env

// Generate application key
go run . artisan key:generate
```

Now install [templ](https://templ.guide/quick-start/installation) for html templates and [air](https://github.com/cosmtrek/air?tab=readme-ov-file#installation) for hot reloading:
```bash
go install github.com/a-h/templ/cmd/templ@latest
go install github.com/cosmtrek/air@latest
```

## Configure a simple frontend template structure
(work in progress - I will update with global variables and script push)

&bull; Add this line in your `/.gitignore` file: `*_templ.go`

&bull; Delete `resources/views/welcome.tmpl`

&bull; Create 2 folders in `resources/views`, `home` and `parts`

&bull; In the folder `resources/views/parts` create 3 files:

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
&bull; Create your homepage component: `resources/views/home/index.templ`
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
Their documentation for [children components is here](https://templ.guide/syntax-and-usage/template-composition). They have an example for a layout structure but I find this method better.

## Use this homepage component in your controller
I made this new file `app/http/controllers/controller.go` where I can store some helpers available to any controller.
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
This helper renders the provided templ component in the response buffer along with a 200 status header.
Let's use it in `app/http/controllers/home_controller.go`
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
Now set this new route:
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
## Configure hot reloading with Air
Goravel already comes with the configuration file (`.air.toml`) you need for this, we only need to add the `templ generate` command in the cmd parameter, like this:
```diff
[build]
  bin = "./storage/temp/main"
-  cmd = "go build -o ./storage/temp/main ."
+  cmd = "templ generate && go build -o ./storage/temp/main ."
```
If you are using Windows add `.exe` to main in both `bin` and `cmd` parameters:
```toml
[build]
  bin = "./storage/temp/main.exe"
  cmd = "templ generate && go build -o ./storage/temp/main.exe ."
```
Done ! Happy coding !