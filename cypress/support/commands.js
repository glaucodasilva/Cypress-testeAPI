Cypress.Commands.add('login', (usuario) => {
    cy.request({
        method: "POST",
        url: '/login',
        headers: {
            accept: "application/json",
            "content-type": "application/json"
        },
        body: {
            email: usuario.email,
            password: usuario.password
        },
        failOnStatusCode: false
    })
});

Cypress.Commands.add('listarUsuarios', (user) => {
    if (user === undefined) {
        cy.request({
            method: "GET",
            url: '/usuarios',
            headers: {
                accept: "application/json",
                "content-type": "application/json"
            },
            failOnStatusCode: false
        })
    } else {
        cy.request({
            method: "GET",
            url: `/usuarios/${user._id}`,
            headers: {
                accept: "application/json"
            },
            failOnStatusCode: false
        })
    }
});

Cypress.Commands.add('gerarUsuario', (admin) => {
    let novoUser = {}
    cy.geraStringAleatoria(5).then(retorno => {
        novoUser.nome = retorno
        cy.geraStringAleatoria(10).then(retorno => {
            novoUser.email = `${retorno}@${retorno}.com`
            cy.geraStringAleatoria(5).then(retorno => {
                novoUser.password = retorno; 
                novoUser.administrador = admin
                return novoUser
            })
        })
    })  
});

Cypress.Commands.add('cadastraUsuario', (novoUser, admin = "true") => {
    cy.gerarUsuario(admin).then(user => {
        if (novoUser == undefined) {novoUser = user}
        cy.request({
            method: "POST",
            url: '/usuarios',
            headers: {
                accept: "application/json",
                "content-type": "application/json"
            },
            body: {
                nome: novoUser.nome,
                email: novoUser.email,
                password: novoUser.password,
                administrador: novoUser.administrador
              },
            failOnStatusCode: false
        })
    })    
});

Cypress.Commands.add('updateUsuario', (user) => {
    cy.request({
        method: "PUT",
        url: `/usuarios/${user._id}`,
        headers: {
            accept: "application/json",
            "content-type": "application/json"
        },
        body: {
            nome: user.nome,
            email: user.email,
            password: user.password,
            administrador: user.administrador
          },
        failOnStatusCode: false
    })
});

Cypress.Commands.add('excluirUsuario', (user) => {
    cy.request({
        method: "DELETE",
        url: `/usuarios/${user._id}`,
        headers: {
            accept: "application/json"
        },
        failOnStatusCode: false
    })
});

Cypress.Commands.add('listarProdutos', (prod) => {
    if (prod === undefined) {
        cy.request({
            method: "GET",
            url: '/produtos',
            headers: {
                accept: "application/json",
                "content-type": "application/json"
            },
            failOnStatusCode: false
        })
    } else {
        cy.request({
            method: "GET",
            url: `/produtos/${prod._id}`,
            headers: {
                accept: "application/json"
            },
            failOnStatusCode: false
        })
    }
});

Cypress.Commands.add('cadastrarProdutos', (novoProd, token) => {
    cy.request({
        method: "POST",
        url: '/produtos',
        headers: {
            accept: "application/json",
            "Authorization": token,
            "content-type": "application/json"
        },
        body: novoProd,
        failOnStatusCode: false
    })
});

Cypress.Commands.add('geraStringAleatoria', (tamanho) => {
    let stringAleatoria = '';
    let caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < tamanho; i++) {
        stringAleatoria += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return stringAleatoria;
});

Cypress.Commands.add('excluirProduto', (prod, token) => {
    cy.request({
        method: "DELETE",
        url: `/produtos/${prod._id}`,
        headers: {
            accept: "application/json",
            "Authorization": token
        },
        failOnStatusCode: false
    })
});

Cypress.Commands.add('updateProduto', (prod, token) => {
    cy.request({
        method: "PUT",
        url: `/produtos/${prod._id}`,
        headers: {
            accept: "application/json",
            "Authorization": token,
            "content-type": "application/json"
        },
        body: {
            nome: prod.nome,
            preco: prod.preco,
            descricao: prod.descricao,
            quantidade: prod.quantidade
          },
        failOnStatusCode: false
    })
});

Cypress.Commands.add('listarCarrinhos', (car) => {
    if (car === undefined) {
        cy.request({
            method: "GET",
            url: '/carrinhos',
            headers: {
                accept: "application/json"
            },
            failOnStatusCode: false
        })
    } else {
        cy.request({
            method: "GET",
            url: `/carrinhos/${car._id}`,
            headers: {
                accept: "application/json"
            },
            failOnStatusCode: false
        })
    }
});

Cypress.Commands.add('cadastrarCarrinho', (produtos, token) => {
    cy.request({
        method: "POST",
        url: '/carrinhos',
        headers: {
            accept: "application/json",
            "Authorization": token,
            "content-type": "application/json"
        },
        body: {
            produtos: produtos
        },
        failOnStatusCode: false
    })
});

Cypress.Commands.add('usersComCarrinho', () => {
    let userComCarrinho = []
    cy.listarCarrinhos().then(response => {
        const cars = response.body.carrinhos
        for (let i = 0; i < cars.length; i++) {
            userComCarrinho.push(cars[i].idUsuario);   
        }
        return userComCarrinho
    })
});

Cypress.Commands.add('usersSemCarrinho', () => {
    cy.usersComCarrinho().then(userComCarrinho => {
        cy.listarUsuarios().then(listaDeUsuarios => {
            let listaUsers = listaDeUsuarios.body.usuarios 
            for (let i = 0; i < listaUsers.length; i++) {
                if (!userComCarrinho.includes(listaUsers[i]._id)) {
                    return listaUsers[i]
                }
            } 
        })
    }) 
});

Cypress.Commands.add('concluirCompra', (token) => {
    cy.request({
        method: "DELETE",
        url: '/carrinhos/concluir-compra',
        headers: {
            accept: "application/json",
            "Authorization": token
        },
        failOnStatusCode: false
    })
});

Cypress.Commands.add('cancelarCompra', (token) => {
    cy.request({
        method: "DELETE",
        url: '/carrinhos/cancelar-compra',
        headers: {
            accept: "application/json",
            "Authorization": token
        },
        failOnStatusCode: false
    })
});
