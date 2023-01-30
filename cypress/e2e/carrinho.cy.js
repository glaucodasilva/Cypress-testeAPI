/// <reference types="Cypress" />

describe('teste da API https://serverest.dev/ - Carrinhos', () => {
    let carrinhos
    
    before(() => {
        cy.fixture('carrinhos').then(file => {
            carrinhos = file
        })
    });

    it('listar carrinhos', () => {
        cy.listarCarrinhos().then(response => {
            expect(response.body.carrinhos).to.have.lengthOf(response.body.quantidade)
            carrinhos = response.body.carrinhos
            cy.writeFile('./cypress/fixtures/carrinhos.json', carrinhos)
        })
    });

    it('Cadastrar carrinho', () => {
        let novoCar = {produtos: []}

        cy.listarProdutos().then(response => {
            let produtos = response.body.produtos
            const max = Math.floor(Math.random() * (produtos.length - 1) + 1)
            for (let i = 0; i < max; i++) {
                let prodComp = {};
                prodComp.idProduto = produtos[i]._id;
                prodComp.quantidade = Math.floor(Math.random() * (produtos[i].quantidade - 1) + 1);
                novoCar.produtos[i] = prodComp;
            }

            cy.cadastraUsuario().then(response => {
                expect(response.body._id).to.exist
                cy.usersSemCarrinho().then(usersSemCarrinho => {
                    cy.login(usersSemCarrinho).then(responseToken => {
                        cy.cadastrarCarrinho(novoCar.produtos, responseToken.body.authorization).then(response => {
                            expect(response.body._id).to.exist
                            novoCar._id = response.body._id
                            carrinhos.push(novoCar)
                            cy.writeFile('./cypress/fixtures/carrinhos.json', carrinhos)
                        })
                    })
                })
            })
        })
    });

    it('ao tentar cadastrar um carrinho com itens duplicados devemos receber a mensagem "Não é permitido possuir produto duplicado"', () => {
        let novoCar = {produtos: []}

        cy.listarProdutos().then(response => {
            let produtos = response.body.produtos
            let prodComp = {};
            prodComp.idProduto = produtos[0]._id;
            prodComp.quantidade = 1;
            novoCar.produtos[0] = prodComp;
            novoCar.produtos[1] = prodComp;

            cy.cadastraUsuario().then(response => {
                cy.usersSemCarrinho().then(usersSemCarrinho => {
                    cy.login(usersSemCarrinho).then(responseToken => {
                        cy.cadastrarCarrinho(novoCar.produtos, responseToken.body.authorization).then(response => {
                            expect(response.status).to.equal(400)
                            expect(response.body.message).to.equal('Não é permitido possuir produto duplicado')
                        })
                    })
                })
            })
        })
    });

    it('ao tentar cadastrar dois carrinhos para um mesmo user deve retornar mensagem "Não é permitido ter mais de 1 carrinho"', () => {
        let novoCar = {produtos: []}

        cy.listarProdutos().then(response => {
            let produtos = response.body.produtos.filter((prod) => prod.quantidade > 0)
            const max = Math.floor(Math.random() * (produtos.length - 1) + 1)
            for (let i = 0; i < max; i++) {
                let prodComp = {};
                prodComp.idProduto = produtos[i]._id;
                prodComp.quantidade = Math.floor(Math.random() * (produtos[i].quantidade - 1) + 1);
                novoCar.produtos[i] = prodComp;
            }

            cy.usersComCarrinho().then(usersComCarrinho => {
                cy.listarUsuarios({_id: usersComCarrinho[0]}).then(returnUser => {
                    cy.login(returnUser.body).then(responseToken => {
                        cy.cadastrarCarrinho(novoCar.produtos, responseToken.body.authorization).then(response => {
                            expect(response.status).to.equal(400)
                            expect(response.body.message).to.equal('Não é permitido ter mais de 1 carrinho')
                        })
                    })
                })
                
            })
        })
    });

    it('ao tentar cadastrar um carrinho com um produto inesistente deve retornar a mensagem "Produto não encontrado"', () => {
        let novoCar = {produtos: [{idProduto: 'idInvalido', quantidade: 1}]}

        cy.cadastraUsuario().then(() => {
            cy.usersSemCarrinho().then(usersSemCarrinho => {
                cy.login(usersSemCarrinho).then(responseToken => {
                    cy.cadastrarCarrinho(novoCar.produtos, responseToken.body.authorization).then(response => {
                        expect(response.status).to.equal(400)
                        expect(response.body.message).to.equal('Produto não encontrado')
                    })
                })
            })
        })
    });

    it('ao tentar cadastrar um carrinho com um produto com quantidade maior que o seu saldo, deve retornar a mensagem "Produto não possui quantidade suficiente"', () => {
        let novoCar = {produtos: []}

        cy.listarProdutos().then(response => {
            let produtos = response.body.produtos
            novoCar.produtos[0] = {idProduto: produtos[0]._id, quantidade: produtos[0].quantidade + 1}

            cy.cadastraUsuario().then(() => {
                cy.usersSemCarrinho().then(usersSemCarrinho => {
                    cy.login(usersSemCarrinho).then(responseToken => {
                        cy.cadastrarCarrinho(novoCar.produtos, responseToken.body.authorization).then(response => {
                            expect(response.status).to.equal(400)
                            expect(response.body.message).to.equal('Produto não possui quantidade suficiente')
                        })
                    })
                })
            })
        })
    });

    it('ao tentar cadastrar um carrinho sem um token válido deve retornar status 401', () => {
        let novoCar = {produtos: []}

        cy.listarProdutos().then(response => {
            let produtos = response.body.produtos
            novoCar.produtos[0] = {idProduto: produtos[0]._id, quantidade: 1}

            cy.cadastrarCarrinho(novoCar.produtos, 'tokenInvalido').then(response => {
                expect(response.status).to.equal(401)
                expect(response.body.message).to.equal("Token de acesso ausente, inválido, expirado ou usuário do token não existe mais")
            })
        })
    });

    it('Buscar carrinho por ID', () => {
        cy.listarCarrinhos(carrinhos.filter((carrinhos) => carrinhos._id != undefined)[0]).then(response => {
            expect(response.body.message).to.not.exist
        })
    });

    it('ao tentar buscar carrinho com um ID inválido deve retornar status 400', () => {
        cy.listarCarrinhos({_id: 'idInvalido'}).then(response => {
            expect(response.status).to.equal(400)
            expect(response.body.message).to.equal("Carrinho não encontrado")
        })
    });

    it('Ao concluir uma compra o carrinho é excluído.', () => {
        cy.usersComCarrinho().then(idUser => {
            let user = {}
            user._id = idUser[0]

            cy.listarUsuarios(user).then(user => {
                cy.login(user.body).then(responseToken => {
                    expect(responseToken.body.authorization).to.exist
                    cy.concluirCompra(responseToken.body.authorization).then(response => {
                        expect(response.body.message).to.have.contain('Registro excluído com sucesso')
                    })
                })
            })
        })
    });

    it('Ao tentar concluir uma compra de um usuário sem carrionho deve retoranr erro "Não foi encontrado carrinho para esse usuário"', () => {
        cy.usersSemCarrinho().then(user => {
            cy.login(user).then(responseToken => {
                cy.concluirCompra(responseToken.body.authorization).then(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body.message).to.equal("Não foi encontrado carrinho para esse usuário")
                })
            })
        })
    });

    it('Ao entar concluir uma compra com um token de usuário invalido deve retornar status 401', () => {
        cy.concluirCompra('tokenInvalido').then(response => {
            expect(response.status).to.equal(401)
            expect(response.body.message).to.equal("Token de acesso ausente, inválido, expirado ou usuário do token não existe mais")
        })
    });

    it('Ao cancelar uma compra o carrinho é excluído e o estoque dos produtos desse carrinho é reabastecido.', () => {
        cy.usersComCarrinho().then(idUser => {
            let user = {}
            user._id = idUser[0]

            cy.listarUsuarios(user).then(user => {
                cy.login(user.body).then(responseToken => {
                    expect(responseToken.body.authorization).to.exist
                    cy.cancelarCompra(responseToken.body.authorization).then(response => {
                        expect(response.body.message).to.have.contain('Registro excluído com sucesso')
                    })
                })
            })
        })
    });

    it('ao tentar cancelar um carrinho inexistente deve retornar a mensagem "Não foi encontrado carrinho para esse usuário"', () => {
        cy.usersSemCarrinho().then(user => {
            cy.login(user).then(responseToken => {
                cy.cancelarCompra(responseToken.body.authorization).then(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body.message).to.equal("Não foi encontrado carrinho para esse usuário")
                })
            })
        })
    });

    it('Ao entar cancelar uma compra com um token de usuário invalido deve retornar status 401', () => {
        cy.cancelarCompra('tokenInvalido').then(response => {
            expect(response.status).to.equal(401)
            expect(response.body.message).to.equal("Token de acesso ausente, inválido, expirado ou usuário do token não existe mais")
        })
    });
});