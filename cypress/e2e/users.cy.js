/// <reference types="Cypress" />

describe('teste da API https://serverest.dev/ - Usuários', () => {
    let usuarios
    
    before(() => {
        cy.fixture('users').then(users => {
            usuarios = users
        })
    });

    it('Listar usuários cadastrados', () => {
        cy.listarUsuarios().then(listaDeUsuarios => {
            expect(listaDeUsuarios.body.usuarios).to.have.lengthOf(listaDeUsuarios.body.quantidade)
            usuarios = listaDeUsuarios.body.usuarios
            cy.writeFile('./cypress/fixtures/users.json',usuarios)
        })
    });

    it('cadastrar novo usuario', () => {
        cy.cadastraUsuario().then(response => {
            expect(response.body._id).to.exist
            cy.listarUsuarios().then(listaDeUsuarios => {
                usuarios = listaDeUsuarios.body.usuarios
                cy.writeFile('./cypress/fixtures/users.json', usuarios)
            })
        })
    });

    it('ao tentar cadastrar um usuário com um email existente deverá retornar mensagem com erro de email já cadastrado', () => {
        cy.listarUsuarios().then(listaDeUsuarios => {
            usuarios = listaDeUsuarios.body.usuarios
            cy.cadastraUsuario(usuarios[0]).then(response => {
                expect(response.body.message).to.have.contain('Este email já está sendo usado')
            }) 
        })
    });

    it('com usuário válido do users.json retorna o token de autorização', () => {
        cy.login(usuarios.filter((user) => user._id != undefined)[0]).then(responseToken => {
            expect(responseToken.body.authorization).to.exist
        })       
    });

    it('selecionando usuário admin da listagem verificar se retorna o token de autorização', () => {
        cy.listarUsuarios().then(listaDeUsuarios => {
            expect(listaDeUsuarios.body.usuarios).to.have.lengthOf(listaDeUsuarios.body.quantidade)
            const admin_user = listaDeUsuarios.body.usuarios.filter((user) => user.administrador == 'true')
            cy.login(admin_user[0]).then(responseToken => {
                expect(responseToken.body.authorization).to.exist
            })
        })
    });

    it('buscar um usuário cadastrado, pelo id dele', () => {
        const idUser = usuarios.filter((user) => user._id != undefined)[0]
        cy.listarUsuarios(idUser).then( response => {
            expect(response.body._id).to.have.contain(idUser._id)
        })
    });

    it('ao buscar um usuário com um id errado retorna mensagem de "Usuário não encontrado"', () => {
        cy.listarUsuarios({_id: 'invalido'}).then( response => {
            expect(response.body.message).to.have.contain("Usuário não encontrado")
        })
    });

    it('atualizar um usuário cadastrado', () => {
        cy.updateUsuario(usuarios.filter((user) => user._id != undefined)[0]).then( response => {
            expect(response.body.message).to.have.contain("Registro alterado com sucesso")
        })
    });

    it('ao enviar dados de um usuário ainda não cadastrado pelo método de atualização o usuário deve ser cadastrado', () => {
        cy.gerarUsuario().then(user => {
            cy.updateUsuario(user).then( response => {
                expect(response.body._id).to.exist
            })
        })
    });

    it('ao enviar dados de um usuário já cadastrado pelo método de atualização sem o seu ID devemos receber a mensagem "Este email já está sendo usado"', () => {
        cy.listarUsuarios().then(listaDeUsuarios => {
            let user = listaDeUsuarios.body.usuarios[0]
            delete user._id
            cy.updateUsuario(user).then( response => {
                expect(response.status).to.equal(400)
            })
        })
    });

    it('excluir um usuário cadastrado', () => {
        cy.usersSemCarrinho().then(user => {
            cy.excluirUsuario(user).then( response => {
                expect(response.body.message).to.have.contain('Registro excluído com sucesso')
                cy.listarUsuarios().then(listaDeUsuarios => {
                    expect(listaDeUsuarios.body.usuarios).to.have.lengthOf(listaDeUsuarios.body.quantidade)
                    usuarios = listaDeUsuarios.body.usuarios
                    cy.writeFile('./cypress/fixtures/users.json',usuarios)
                })    
            })
        })
        
    });

    it('excluir um usuário cadastrado que tenha um carrinho ativo, deve ser retornada a mensagem com código 400', () => {
        cy.usersComCarrinho().then(userComCarrinho => {
            let user = {}
            user._id = userComCarrinho[0]
            cy.excluirUsuario(user).then( response => {
                expect(response.body.idCarrinho).to.exist
            })
        })
        
    });
});